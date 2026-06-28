declare module 'page-flip' {
  export class PageFlip {
    constructor(element: HTMLElement, options: any);
    loadFromHTML(items: NodeListOf<HTMLElement> | HTMLElement[]): void;
    update(): void;
    turnToPage(page: number): void;
    turnToNextPage(): void;
    turnToPrevPage(): void;
    flipNext(corner?: 'top' | 'bottom'): void;
    flipPrev(corner?: 'top' | 'bottom'): void;
    flip(page: number, corner?: 'top' | 'bottom'): void;
    destroy(): void;
    on(eventName: string, callback: (e: any) => void): void;
    getPageCount(): number;
    getCurrentPageIndex(): number;
  }
}
