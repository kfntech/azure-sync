import dotenv from 'dotenv'
import { resolve } from 'path'
import { find, test } from './services/storage-cleaner'

const result = dotenv.config({ path: resolve(__dirname, '../.env') })
if (result.error) throw result.error

const datasource = [
    { tableName: 'PatricioPersonalMusics', columnName: 'CoverKey' },
    { tableName: 'PatricioPersonalMusics', columnName: 'AudioKey' },
    { tableName: 'PatricioPersonalMoments', columnName: 'ImageKey' },
]

// test()
find(datasource, 'patriciopersonal').subscribe(res => console.log(res[0]))