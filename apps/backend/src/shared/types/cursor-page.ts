type Cursor = number | null;

export interface CursorPage<T> {
  rows: Array<T>;
  _meta: {
    total: number;
    cursorPrevious: Cursor;
    cursorNext: Cursor;
  };
}
