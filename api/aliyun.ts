import Core from "@alicloud/pop-core";
import { DnsServer, Params, recordDns } from "./dnsServer";

interface RecordType {
  DomainName: string;
  RecordId: string;
  RR: string;
  Type: string;
  Value: string;
  Line: string;
  Priority: number;
  TTL: number;
  Status: string;
  Locked: boolean;
}

function getRecordKey(record: string): string {
  const keys = record.split(".");
  return keys.length > 0 ? keys[0] : record;
}

export class Aliyun extends DnsServer<RecordType> {
  private client: Core;

  public constructor(p: Params) {
    super(p);
    this.client = new Core({
      accessKeyId: this.identifier,
      accessKeySecret: this.secret,
      endpoint: "https://alidns.aliyuncs.com",
      apiVersion: "2015-01-09",
    });
  }

  public async addRecord() {
    const params = {
      DomainName: this.domain,
      RR: this.name,
      Type: this.type,
      Value: this.ip,
    };
    const requestOption = {
      method: "POST",
    };
    await this.client.request<{ RequestId: string; RecordId: string }>(
      "AddDomainRecord",
      params,
      requestOption
    );
    return true;
  }

  public async getRecord() {
    const result = await this.client.request<{
      RequestId: string;
      TotalCount: number;
      DomainRecords: { Record: RecordType[] };
    }>(
      "DescribeDomainRecords",
      {
        DomainName: this.domain,
        KeyWord: this.name,
        SearchMode: "EXACT",
      },
      {
        method: "POST",
      }
    );
    if (result && result.DomainRecords.Record.length > 0) {
      return result.DomainRecords.Record[0];
    }
    return undefined;
  }

  public isSameRecord(ip: string, record: RecordType) {
    return ip === record.Value;
  }

  public async updateRecord(record: RecordType) {
    const params = {
      RecordId: record.RecordId,
      DomainName: this.domain,
      RR: this.name,
      Type: this.type,
      Value: this.ip,
    };
    await this.client.request<{ RequestId: string; RecordId: string }>(
      "UpdateDomainRecord",
      params,
      {
        method: "POST",
      }
    );
    return true;
  }
}

module.exports = recordDns(Aliyun);
