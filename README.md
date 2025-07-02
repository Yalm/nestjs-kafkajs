# nestjs-kafkajs

**A NestJS module for integrating with Apache Kafka using kafkajs**

Date: July 1, 2025

## Description

This package provides an easy way to publish and subscribe to events on Apache Kafka from a NestJS application, leveraging the [kafkajs](https://github.com/tulios/kafkajs) library.

## Features

- Reusable connection to one or multiple brokers.
- `@SubscribeTo(topic: string)` decorator to subscribe methods to specific topics.
- Automatic loading of event subscribers via a dynamic loader.
- Access to event metadata for extending functionality.

## Folder Structure

```text
├── lib/
│   ├── constants.ts                  # Global constants
│   ├── kafka-connection.ts           # Kafka initialization and configuration
│   ├── kafkajs.module.ts             # NestJS main module
│   ├── index.ts                      # Entry point (re-exports)
│   ├── event-subscribers.loader.ts   # Automatic event subscribers loader
│   ├── events-metadata.accessor.ts   # Event metadata management
│   ├── decorators/
│   └── interfaces/
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js >= 14
- NestJS >= 8
- Access to an Apache Kafka cluster (local or remote)

## Installation

```powershell
npm install --save nestjs-kafkajs kafkajs
```

Add development dependencies if using TypeScript:

```powershell
npm install --save-dev @types/node
```

## Configuration

In your root module (`AppModule`), import and register the Kafka connection:

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { KafkajsModule } from 'nestjs-kafkajs';

@Module({
  imports: [
    KafkajsModule.register({
      clientId: 'my-app',
      brokers: ['localhost:9092'],
      ssl: false,
      sasl: null,
    }),
  ],
})
export class AppModule {}
```

The `KafkaOptions` interface is located in `lib/interfaces/kafka-options.interface.ts`.

## Usage

### Publishing Events

To publish a message to a topic:

```ts
// example-publisher.service.ts
import { Injectable } from '@nestjs/common';
import { KafkaProducer } from 'nestjs-kafkajs';

@Injectable()
export class PublisherService {
  constructor(private readonly producer: KafkaProducer) {}

  async publish() {
    await this.producer.send({
      topic: 'my-topic',
      messages: [{ key: 'order', value: JSON.stringify({ id: 1, total: 100 }) }],
    });
  }
}
```

### Subscribing to Events

Use the `@SubscribeTo(topic: string)` decorator to bind a method to incoming messages:

```ts
// order-subscriber.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { SubscribeTo } from 'nestjs-kafkajs';

@Injectable()
export class OrderSubscriber {
  private readonly logger = new Logger(OrderSubscriber.name);

  @SubscribeTo('my-topic')
  handleOrderEvent(message: { key: Buffer; value: Buffer }) {
    const payload = JSON.parse(message.value.toString());
    this.logger.log(`Processing order ${payload.id} with total ${payload.total}`);
    // ... additional logic ...
  }
}
```

The loader in `event-subscribers.loader.ts` automatically detects classes with decorated methods.

## Event Metadata

The `EventsMetadataAccessor` class allows you to:

- Inspect subscribed topics.
- Extend subscription behavior.

```ts
import { EventsMetadataAccessor } from 'nestjs-kafkajs';

const topics = new EventsMetadataAccessor().getTopics(new OrderSubscriber());
```

## Publishing to npm

Follow these steps to publish the package to the npm registry:

1. Ensure the `name` and `version` fields in `package.json` are correctly set.
2. Run `npm login` to authenticate with npm.
3. Publish the package:
   ```powershell
   npm publish --access public
   ```
4. To install and use the package from npm:
   ```powershell
   npm install --save nestjs-kafkajs
   ```

## Contributing

1. Fork the repository.
2. Create a branch for your feature (`git checkout -b feature/new-feature`).
3. Commit your changes.
4. Open a pull request describing your contribution.

## License

This project is licensed under the MIT License.
