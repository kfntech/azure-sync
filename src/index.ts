import minimist from 'minimist'
import dotenv from 'dotenv'
import { resolve } from 'path'
import { find, clear } from './services/storage-cleaner'
import { take } from 'rxjs/operators'
import { backup$ } from './services/database-backup'
import { find$, mirror$ } from './services/storage-clone'

const result = dotenv.config({ path: resolve(__dirname, '../.env') })
if (result.error) throw result.error

const argv = minimist(process.argv.slice(2))
console.log('Started')

switch(argv['a'] || argv['action']) {
    case 'clean':
        var container: string = argv['c'] || argv['container']
        var tables = ((argv['s'] || argv['source']) as string).split(',')
        const datasource = tables.map(el => ({ tableName: el.split(':')[0], columnName: el.split(':')[1] }));
        console.log(`Removing unused blobs from ${container} of tables `, tables)

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
        var tables = ((argv['s'] || argv['source']) as string).split(',')
        console.log(`Backing up tables `, tables)
        backup$(tables).subscribe(() => console.log('Done'), err => console.error(err), () => process.exit(0))
    break
    case 'clone':       
        var container: string = argv['c'] || argv['container']

        if(argv['e'] || argv['exec']) {
            mirror$(container).subscribe(() => console.log('Done'), err => console.error(err))   
        } else {
            find$(container).subscribe(res => console.log(res.map(el => el.name)), err => console.error(err))   
        } 
    break
    default: console.error('No Action specified, please assign an action with -action. For more information please consult -help')
}