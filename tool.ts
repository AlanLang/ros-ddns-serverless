export const checkQuery = (params: any) => {
    const queryList = ["id", "secret", "domain", "record", "ip"]
    for (let index = 0; index < queryList.length; index++) {
        const element = queryList[index];
        if(!params[element]) {
            return `${element} 不能为空`
        }
    }
    return ""
}