import {
  Inject,
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { Consumer, EachMessagePayload, Kafka, Producer } from 'kafkajs';
import { KafkaModuleOptions } from './interfaces';
import { isUndefined } from '@nestjs/common/utils/shared.utils';
import {
  KAFKA_DEFAULT_GROUP,
  KAFKA_MODULE_OPTIONS,
  KAFKA_PRODUCER,
  SUBSCRIBE_TO_METADATA,
} from './constants';

@Injectable()
export class EventSubscribersLoader
  implements OnModuleInit, OnApplicationShutdown
{
  private readonly consumer: Consumer;
  private readonly messageHandlers = new Map<string, any>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    @Inject(KAFKA_MODULE_OPTIONS)
    private readonly kafkaModuleOptions: KafkaModuleOptions,
    private readonly kafka: Kafka,
    @Inject(KAFKA_PRODUCER) private readonly producer: Producer,
  ) {
    this.consumer = this.kafka.consumer({
      ...(this.kafkaModuleOptions.consumer ?? {}),
      groupId: this.kafkaModuleOptions.consumer?.groupId ?? KAFKA_DEFAULT_GROUP,
    });
  }

  async onModuleInit() {
    await this.connect();
    await this.loadEventListeners();
    await this.consumer.run({
      eachMessage: this.handleMessage.bind(this),
      ...(this.kafkaModuleOptions.run || {}),
    });
  }

  async onApplicationShutdown() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }

  async connect() {
    await this.producer.connect();
    await this.consumer.connect();
  }

  handleMessage<T = any>(payload: EachMessagePayload) {
    const handler = this.messageHandlers.get(payload.topic);
    let message: T | undefined = undefined;
    if (payload.message.value) {
      try {
        message = JSON.parse(payload.message.value.toString());
      } catch (error) {
        console.error(error);
      }
    }

    return handler(message, payload, this.consumer);
  }

  async loadEventListeners() {
    const providers = this.discoveryService
      .getProviders()
      .filter((wrapper) => wrapper.instance && !wrapper.isAlias);
    for (const provider of providers) {
      const instancePrototype = Object.getPrototypeOf(provider.instance);
      this.metadataScanner
        .getAllMethodNames(instancePrototype)
        .forEach((method) =>
          this.exploreMethodMetadata(
            instancePrototype,
            method,
            provider.instance,
          ),
        );
    }

    await this.consumer.subscribe({
      topics: [...this.messageHandlers.keys()],
      fromBeginning: this.kafkaModuleOptions.subscribe?.fromBeginning,
    });
  }

  public exploreMethodMetadata(
    instancePrototype: object,
    methodName: string,
    instance: unknown,
  ) {
    const callback = instancePrototype[methodName];
    const topic = Reflect.getMetadata(SUBSCRIBE_TO_METADATA, callback);

    if (!isUndefined(topic)) {
      this.messageHandlers.set(topic, callback.bind(instance));
    }
  }
}
