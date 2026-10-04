/**
 * A deterministic hash of simulation outputs, for golden-hash tests.
 * Two FNV-1a 32-bit streams over the raw bytes of the typed arrays.
 */
type Hashable = Float64Array | Float32Array | Int32Array | Uint8Array | Int8Array;

export class Hasher {
  private h1 = 0x811c9dc5;
  private h2 = 0x050c5d1f;

  update(arr: Hashable): this {
    const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
    let h1 = this.h1;
    let h2 = this.h2;
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i] ?? 0;
      h1 = Math.imul(h1 ^ b, 0x01000193);
      h2 = Math.imul(h2 ^ b, 0x01000193) ^ (h2 >>> 13);
    }
    this.h1 = h1;
    this.h2 = h2;
    return this;
  }

  updateNumber(x: number): this {
    const a = new Float64Array(1);
    a[0] = x;
    return this.update(a);
  }

  updateString(s: string): this {
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i) & 0xff;
    return this.update(bytes);
  }

  /** 16 hex characters. */
  digest(): string {
    const hex = (h: number): string => (h >>> 0).toString(16).padStart(8, '0');
    return hex(this.h1) + hex(this.h2);
  }
}
