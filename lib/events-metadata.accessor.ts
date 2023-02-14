import { Injectable, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SUBSCRIBE_TO_METADATA } from './constants';
import { SubscribeTotadata } from './decorators';

@Injectable()
export class EventsMetadataAccessor {
  constructor(private readonly reflector: Reflector) {}

  getEventHandlerMetadata(
    target: Type<unknown>,
  ): SubscribeTotadata[] | undefined {
    return this.reflector.get(SUBSCRIBE_TO_METADATA, target);
  }
}
