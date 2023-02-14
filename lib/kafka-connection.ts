import { Inject, Injectable } from '@nestjs/common';
import { isNil, isObject, isString } from '@nestjs/common/utils/shared.utils';
import { Producer, ProducerRecord } from 'kafkajs';
import { KAFKA_PRODUCER } from './constants';

@Injectable()
export class KafkaConnection {
  constructor(@Inject(KAFKA_PRODUCER) private readonly producer: Producer) {}

  public publish(
    topic: string,
    message: any,
    options?: Omit<ProducerRecord, 'topic' | 'message'>,
  ) {
    const isNotKafkaMessage =
      isNil(message) ||
      !isObject(message) ||
      (!('key' in message) && !('value' in message));

    if (isNotKafkaMessage) {
      message = { value: message };
    }

    const isObjectOrArray =
      !isNil(message.value) &&
      !isString(message.value) &&
      !Buffer.isBuffer(message.value);

    if (isObjectOrArray) {
      message = { value: JSON.stringify(message.value) };
    }

    return this.producer.send({
      topic,
      messages: [message],
      ...options,
    });
  }
}
