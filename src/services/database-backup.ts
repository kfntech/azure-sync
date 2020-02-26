import { concat, of } from 'rxjs'
import { resolve } from 'path'
import { tap, switchMap, skip } from 'rxjs/operators'
import { exec$, transport$, resolveFolder } from '../utils/file-helper'

export const backup$ = (tableNames: string[]) => of(resolveFolder('../SyncTemp')).pipe(
    switchMap(res => concat(
        ...tableNames.map(el => exec$(`bcp ${el} out ${res}/${el}.dat ${connectionString()} -c`))
    )),
    tap(res => console.log((res[0] as string).split('\n')[5])),
    skip(tableNames.length - 1),
    switchMap(() => transport$('SyncTemp'))
)

export const restore$ = () => {

}

export const connectionString = () => `-S ${process.env.AZURE_SQL_SERVER!} -U ${process.env.AZURE_SQL_USERNAME!} -P ${process.env.AZURE_SQL_PASSWORD!} -d ${process.env.AZURE_SQL_DATABASE!}`