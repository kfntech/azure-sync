import { concat, of, iif, Observable } from 'rxjs'
import { tap, switchMap, skip, take } from 'rxjs/operators'
import { exec$, resolveFolder, transport$ } from '../utils/file-helper'
import { azureConnectionString, mirrorConnectionConfig, sqlDatabase$, rowCount$, setServer$, sendQuery$, mirrorConnectionString } from '../utils/sql-helper'
import { resolve } from 'path'
import { existsSync, rmdirSync } from 'fs'

const folderName = 'SyncTemp'

export const backup$ = (tableNames: string[], remote: boolean = false) => of(resolveFolder(`../${folderName}`)).pipe(
    switchMap(res => concat(
        ...tableNames.map(el => exec$(`bcp ${el} out ${res}/${el}.dat ${azureConnectionString()} -c`))
    )),
    tap(res => console.log((res[0] as string).split('\n')[5])),
    skip(tableNames.length - 1),
    switchMap(res => iif(() => remote, transport$(folderName), of(res)))
)

export const restore$ = (tableNames: string[]) => new Observable<string[]>(sub => {
    if(!existsSync(resolve(process.env.TEMP_PATH!, folderName))) {
        return sub.error(new Error(`${folderName} Not found! Likely an error with remote transport from source server`))
    }

    sqlDatabase$.pipe(
        switchMap(() => rowCount$),
        take(1)
    ).subscribe(() => sub.next(tableNames), err => sub.error(err), () => sub.complete())

    setServer$.next(mirrorConnectionConfig())
    sendQuery$.next(`${tableNames.map(el => ` DELETE FROM ${el}`).join(';')}`)
}).pipe(
    switchMap(res => concat(
        ...res.map(el => exec$(`bcp ${el} in ${resolve(process.env.TEMP_PATH!, folderName, `${el}.dat`)} ${mirrorConnectionString()} -c -q`))
    )),
    tap(res => console.log((res[0] as string).split('\n')[5])),
    skip(tableNames.length - 1),
    tap(() => {
        console.log(`Deleting ${folderName}`)
        rmdirSync(resolve(process.env.TEMP_PATH!, folderName), { recursive: true })
    })
)