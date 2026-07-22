function generateRandomValue(min: number, max: number, numAfterDigit: number = 0): number {
  return Number((Math.random() * (max - min) + min).toFixed(numAfterDigit));
}

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomItems<T>(array: T[], count: number = 1, randomize: boolean = false): T[] {
  const startIndex = Math.floor(Math.random() * (array.length - count));
  if (randomize) {
    return array.sort(() => Math.random() - 0.5).slice(startIndex, startIndex + count);
  }
  return array.slice(startIndex, startIndex + count);
}

// TSV
function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;

  let current: Record<string, unknown> = obj;
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[lastKey] = value;
}

export {
  generateRandomValue,
  getRandomItem,
  getRandomItems,
  getNestedValue,
  setNestedValue,
};
