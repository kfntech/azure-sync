import minimist from 'minimist'
import dotenv from 'dotenv'
import { resolve } from 'path'
import { find, clear } from './services/storage-cleaner'
import { blobList$, setContainer$ } from './utils/storage-helper'
import { take } from 'rxjs/operators'

const result = dotenv.config({ path: resolve(__dirname, '../.env') })
if (result.error) throw result.error

// Fail safe for the program to exist after 5 minutes.
setTimeout(() => process.exit(1), 300000)

const argv = minimist(process.argv.slice(2))

switch(argv['a'] || argv['action']) {
    case 'clean':
        const source: string = argv['s'] || argv['source']
        var container: string = argv['c'] || argv['container']
        const datasource = source.split(',').map(el => ({ tableName: el.split(':')[0], columnName: el.split(':')[1] }));
        (argv['e'] || argv['exec'])
        ? clear(datasource, container).pipe(take(1)).subscribe(res => console.log(res))
        : find(datasource, container)
            .pipe(take(1))
            .subscribe(res => { console.log(res.map(el => el.name)); process.exit(0) })
        break
    case 'list':
        var container: string = argv['c'] || argv['container']
        blobList$.subscribe(res => console.log(res.map(el => el.name)))
        setContainer$.next(container)
        break
    default: console.error('No Action specified, please assign an action with -action. For more information please consult -help')
}

// const datasource = [
//     { tableName: 'PatricioPersonalMusics', columnName: 'CoverKey' },
//     { tableName: 'PatricioPersonalMusics', columnName: 'AudioKey' },
//     { tableName: 'PatricioPersonalMoments', columnName: 'ImageKey' },
// ]

// clear(datasource, 'patriciopersonal')
// .subscribe(res => console.log(res))