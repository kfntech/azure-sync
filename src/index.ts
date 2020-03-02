import minimist from 'minimist'
import dotenv from 'dotenv'
import { resolve } from 'path'
import { find$ as findUnused$, clear$ } from './services/storage-cleaner'
import { take } from 'rxjs/operators'
import { backup$, restore$, allFileInTemp } from './services/database-backup'
import { find$, mirror$, replace } from './services/storage-clone'

const result = dotenv.config({ path: resolve(__dirname, '../.env') })
if (result.error) throw result.error

const argv = minimist(process.argv.slice(2))
console.log('Started')

switch(argv['a'] || argv['action']) {
    case 'clean':
        var container: string = argv['c'] || argv['container']
        var tables = ((argv['s'] || argv['source']) as string).split(',')
        const datasource = tables.map(el => ({ tableName: el.split(':')[0], columnName: el.split(':')[1] }));

        if(argv['e'] || argv['exec']) {
            console.log(`Removing unused blobs from ${container} of tables `, tables)
            clear$(datasource, container)
            .subscribe(res => console.log(res), err => console.error(err))
        } else {
            console.log(`Cross matching unused blobs from ${container} of tables `, tables)
            findUnused$(datasource, container)
            .pipe(take(1))
            .subscribe(res => console.log(res.map(el => el.name)), err => console.error(err))
        }
    break
    case 'backup':
        var tables = ((argv['s'] || argv['source']) as string).split(',')
        var remote: boolean = argv['r'] || argv['remote']
        console.log(`Backing up tables `, tables)

        backup$(tables, remote)
        .subscribe(() => console.log('Done'), err => console.error(err), () => process.exit(0)) // remove exit
    break
    case 'restore':
        var tables = allFileInTemp()
        console.log(`Restoring tables`, tables)
        restore$(tables).pipe(take(1)).subscribe(() => console.log('Done'), err => console.error(err))
    break
    case 'clone':       
        var container: string = argv['c'] || argv['container']
        var remote: boolean = argv['r'] || argv['remote']

        if(argv['e'] || argv['exec']) {
            mirror$(container, remote)
            .subscribe(() => console.log('Done'), err => console.error(err))   
        } else {
            find$(container).subscribe(res => console.log(res.map(el => el.name)), err => console.error(err))   
        } 
    break
    case 'replace':
        var container: string = argv['c'] || argv['container']
        var targetPath: string = argv['p'] || argv['path']
        replace(container, targetPath)
        console.log('Done')
    break
    default: console.error('No Action specified, please assign an action with -action. For more information please consult -help')
}