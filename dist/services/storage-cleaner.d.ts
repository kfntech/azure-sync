import { Observable, Subject } from 'rxjs';
import { ColumnValue } from 'tedious';
export declare const setQuery$: Subject<string>;
export declare const sqlDatabase$: Observable<ColumnValue>;
