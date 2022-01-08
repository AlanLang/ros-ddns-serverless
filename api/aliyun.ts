import { VercelRequest, VercelResponse } from '@vercel/node';
import { checkQuery } from "../tool"
const Core = require('@alicloud/pop-core');
module.exports = async (req: VercelRequest, res: VercelResponse) => {
const error = checkQuery(req.query)
    if(error) {
        res.send({
            error: error
        })
        return
    }
    const {id, secret, domain, record, ip} = req.query;
    var client = new Core({
        accessKeyId: id,
        accessKeySecret: secret,
        endpoint: 'https://alidns.aliyuncs.com',
        apiVersion: '2015-01-09'
      });
      var params = {
        "DomainName": domain,
        "RR": record,
        "Type": "A",
        "Value": ip
      }
      var requestOption = {
        method: 'POST'
      };
      client.request('AddDomainRecord', params, requestOption).then((result) => {
        res.send(result);
      }, (ex) => {
        res.send(ex);
      })
}