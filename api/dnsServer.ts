import { VercelRequest, VercelResponse } from "@vercel/node";

export type Params = {
  type: string;
  name: string;
  ip: string;
  identifier: string;
  secret: string;
  domain: string;
};

export abstract class DnsServer<T> {
  protected type: string; // 解析类型：A AAAA 等
  protected name: string; // 地址前缀
  protected domain: string; //地址主机
  protected ip: string;
  protected identifier: string;
  protected secret: string;

  public constructor({ type, name, ip, identifier, secret, domain }: Params) {
    this.type = type;
    this.name = name;
    this.ip = ip;
    this.identifier = identifier;
    this.secret = secret;
    this.domain = domain;
  }

  public abstract getRecord(): Promise<T | undefined>;

  public abstract addRecord(): Promise<boolean>;

  public abstract updateRecord(record: T): Promise<boolean>;

  public abstract isSameRecord(ip: string, record: T): boolean;
}

export const checkQuery = (params: { [key: string]: string }) => {
  const queryList = ["type", "name", "ip", "identifier", "secret", "domain"];
  for (let index = 0; index < queryList.length; index++) {
    const element = queryList[index];
    if (!params[element]) {
      return `${element} 不能为空`;
    }
  }
  return "";
};

type Target = new (params: Params) => DnsServer<any>;

export async function recordDns(target: Target) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const params = req.query as Params;
    const error = checkQuery(params);
    if (error) {
      res.send({
        error,
      });
      return;
    }

    try {
      const dnsServer = new target(params);
      const record = (await dnsServer.getRecord()) as any;
      if (record) {
        if (!dnsServer.isSameRecord(params.ip, record)) {
          await dnsServer.updateRecord(record);
          res.send({
            success: true,
            message: "更新成功",
          });
        } else {
          res.send({
            success: true,
            message: "无需更新",
          });
        }
      } else {
        await dnsServer.addRecord();
        res.send({
          success: true,
          message: "添加成功",
        });
      }
    } catch (e) {
      res.send({
        success: false,
        error: e,
      });
    }
  };
}
