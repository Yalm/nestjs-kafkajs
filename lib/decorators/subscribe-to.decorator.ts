import { SUBSCRIBE_TO_METADATA } from '../constants';
import { SetMetadata } from '@nestjs/common';

export interface SubscribeTotadata {
  topic: string;
}

export function SubscribeTo(topic: string): MethodDecorator {
  return SetMetadata(SUBSCRIBE_TO_METADATA, topic);
}
