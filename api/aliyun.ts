import { VercelRequest, VercelResponse } from '@vercel/node';
import { checkQuery } from "../tool"
// const Core = require('@alicloud/pop-core');
import Core from "@alicloud/pop-core"

interface RecordType {
  DomainName: string;
  RecordId:   string;
  RR:         string;
  Type:       string;
  Value:      string;
  Line:       string;
  Priority:   number;
  TTL:        number;
  Status:     string;
  Locked:     boolean;
}

type Params = {domain: string; record: string; ip: string; id: string; secret: string}


class Aliyun {
  private client: Core;
  private domain: string;
  private record: string;
  private ip: string;

  constructor({domain, record, ip, id, secret}: Params){
    this.domain = domain;
    this.record = record;
    this.ip = ip;
    this.client = new Core({
      accessKeyId: id,
      accessKeySecret: secret,
      endpoint: 'https://alidns.aliyuncs.com',
      apiVersion: '2015-01-09'
    });
  }

  public addDomainRecord(){
    var params = {
      "DomainName": this.domain,
      "RR": this.record,
      "Type": "A",
      "Value": this.ip
    }
    var requestOption = {
      method: 'POST'
    };
    return this.client.request<{RequestId: string; RecordId: string}>('AddDomainRecord', params, requestOption);
  }

  public describeDomainRecords(){
    return this.client.request<{RequestId: string; TotalCount: number; DomainRecords: {Record: RecordType[]}}>('DescribeDomainRecords', {
      DomainName: this.domain,
      KeyWord: this.record,
      SearchMode: "EXACT",
    },{
      method: 'POST'
    })
  }

  public UpdateDomainRecord(id: string){
    var params = {
      "RecordId": id,
      "DomainName": this.domain,
      "RR": this.record,
      "Type": "A",
      "Value": this.ip
    }
    return this.client.request<{RequestId: string; RecordId: string}>("UpdateDomainRecord", params, {
      method: 'POST'
    })
  }
}

module.exports = async (req: VercelRequest, res: VercelResponse) => {
    const error = checkQuery(req.query)
    if(error) {
        res.send({
            error: error
        })
        return
    }

    try {
      let result: { RequestId: string; RecordId: string }
      const params = req.query as Params;
      const aliyun = new Aliyun(params)
      const record = await aliyun.describeDomainRecords()
      if(record.TotalCount > 0) {
        const domainRecord = record.DomainRecords.Record[0]
        if(domainRecord.Value !== params.ip) {
          result = await aliyun.UpdateDomainRecord(domainRecord.RecordId)
        } else {
          result = {RecordId: domainRecord.RecordId, RequestId:"" }
        }
      } else {
        result = await aliyun.addDomainRecord()
      }
      if (result.RecordId) {
        res.send({
          success: true
        })
      } else {
        res.send(result)
      }
    } catch (e) {
      res.send({
        error: e
      })
    }
}