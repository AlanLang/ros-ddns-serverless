import { DnsServer, recordDns } from "./dnsServer";
import axios from "axios";

export interface CloudflareResult {
  result: Result[];
  success: boolean;
  errors: any[];
  messages: any[];
  result_info: ResultInfo;
}

export interface Result {
  id: string;
  zone_id: string;
  zone_name: string;
  name: string;
  type: string;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  locked: boolean;
  meta: Meta;
  created_on: Date;
  modified_on: Date;
}

export interface Meta {
  auto_added: boolean;
  managed_by_apps: boolean;
  managed_by_argo_tunnel: boolean;
  source: string;
}

export interface ResultInfo {
  page: number;
  per_page: number;
  count: number;
  total_count: number;
  total_pages: number;
}

export class Cloudflare extends DnsServer<Result> {
  public isSameRecord(ip: string, record: Result) {
    return record.content === ip;
  }

  public async getRecord(): Promise<Result | undefined> {
    const { data, status } = await axios.get<CloudflareResult>(
      `https://api.cloudflare.com/client/v4/zones/${this.identifier}/dns_records?type=${this.type}&name=${this.name}.${this.domain}&order=type&direction=desc&match=all`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.secret}`,
        },
      }
    );
    if (status === 200 && data.result.length > 0) {
      return data.result[0];
    }
    return undefined;
  }

  public async addRecord(): Promise<boolean> {
    const { data, status } = await axios.post<CloudflareResult>(
      `https://api.cloudflare.com/client/v4/zones/${this.identifier}/dns_records`,
      {
        type: this.type,
        name: this.name,
        content: this.ip,
        ttl: 1,
        priority: 10,
        proxied: false,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.secret}`,
        },
      }
    );
    if (status === 200 && data.success) {
      return true;
    }
    return false;
  }

  public async updateRecord(record: Result): Promise<boolean> {
    const { data, status } = await axios.put<CloudflareResult>(
      `https://api.cloudflare.com/client/v4/zones/${this.identifier}/dns_records/${record.id}`,
      {
        type: this.type,
        name: this.name,
        content: this.ip,
        ttl: 1,
        proxied: false,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.secret}`,
        },
      }
    );
    if (status === 200 && data.success) {
      return true;
    }
    return false;
  }
}

module.exports = recordDns(Cloudflare);
