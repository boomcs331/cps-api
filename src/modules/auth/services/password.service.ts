import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  async compare(plainText: string, hash: string): Promise<boolean> {
    return argon2.verify(hash, plainText);
  }

  async hash(value: string): Promise<string> {
    return argon2.hash(value);
  }
}
