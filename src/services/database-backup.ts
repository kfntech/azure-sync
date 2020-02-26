import { concat, of } from 'rxjs'
import { tap, switchMap, skip } from 'rxjs/operators'
import { exec$, transport$, resolveFolder } from '../utils/file-helper'
import { connectionString } from '../utils/sql-helper'

export const backup$ = (tableNames: string[]) => of(resolveFolder('../SyncTemp')).pipe(
    switchMap(res => concat(
        ...tableNames.map(el => exec$(`bcp ${el} out ${res}/${el}.dat ${connectionString()} -c`))
    )),
    tap(res => console.log((res[0] as string).split('\n')[5])),
    skip(tableNames.length - 1),
    switchMap(() => transport$('SyncTemp'))
)

export const restore$ = () => {
    // Mirro Server
}