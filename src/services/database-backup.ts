import { concat, of, iif } from 'rxjs'
import { tap, switchMap, skip } from 'rxjs/operators'
import { exec$, resolveFolder, transport$ } from '../utils/file-helper'
import { connectionString } from '../utils/sql-helper'

const folderName = 'SyncTemp'

export const backup$ = (tableNames: string[], remote: boolean = false) => of(resolveFolder(`../${folderName}`)).pipe(
    switchMap(res => concat(
        ...tableNames.map(el => exec$(`bcp ${el} out ${res}/${el}.dat ${connectionString()} -c`))
    )),
    tap(res => console.log((res[0] as string).split('\n')[5])),
    skip(tableNames.length - 1),
    switchMap(res => iif(() => remote, transport$(folderName), of(res)))
)

export const restore$ = () => {
    // Mirro Server
}