export class ActionQueue<T extends string> {
  private item: T | null = null;

  enqueue(action: T): void {
    this.item = action;
  }

  dequeue(): T | null {
    const action = this.item;
    this.item = null;
    return action;
  }

  peek(): T | null {
    return this.item;
  }

  clear(): void {
    this.item = null;
  }

  isEmpty(): boolean {
    return this.item === null;
  }
}
