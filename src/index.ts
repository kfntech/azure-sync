import minimist from 'minimist'
import dotenv from 'dotenv'
import { resolve } from 'path'
import { find, clear } from './services/storage-cleaner'
import { blobList$, setContainer$, blobContainer$ } from './utils/storage-helper'
import { take } from 'rxjs/operators'
import { backup$ } from './services/database-backup'
import { download$ } from './services/storage-clone'
import { sendQuery$, sqlDatabase$ } from './utils/sql-helper'

const result = dotenv.config({ path: resolve(__dirname, '../.env') })
if (result.error) throw result.error

const argv = minimist(process.argv.slice(2))
console.log('Started')

switch(argv['a'] || argv['action']) {
    case 'clean':
        const source: string = argv['s'] || argv['source']
        var container: string = argv['c'] || argv['container']
        const datasource = source.split(',').map(el => ({ tableName: el.split(':')[0], columnName: el.split(':')[1] }));

        if(argv['e'] || argv['exec']) {
            clear(datasource, container)
            .subscribe(res => console.log(res), err => console.error(err))
        } else {
            find(datasource, container)
            .pipe(take(1))
            .subscribe(res => console.log(res.map(el => el.name)), err => console.error(err))
        }
    break
    case 'backup':
        const tables = (argv['s'] || argv['source']).split(',')
        console.log(`Backing up tables `, tables)
        backup$(tables).subscribe(() => console.log('Done'), err => console.error(err), () => process.exit(0))
    break
    case 'clone':       
        sqlDatabase$.pipe(take(1)).subscribe()
        sendQuery$.next(`select * from PatricioPersonalMoments`)
        // download$.subscribe()   
    break
    default: console.error('No Action specified, please assign an action with -action. For more information please consult -help')
}