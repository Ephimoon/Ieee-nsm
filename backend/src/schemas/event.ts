import { Type, type Static } from "@sinclair/typebox";

export const EventSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  description: Type.Optional(Type.String()),
  startTime: Type.String({ format: "date-time" }),
  endTime: Type.String({ format: "date-time" }),
  location: Type.Optional(Type.String()),
  createdBy: Type.String(),
  createdAt: Type.String({ format: "date-time" }),
  updatedAt: Type.String({ format: "date-time" }),
});
export type Event = Static<typeof EventSchema>;

export const CreateEventSchema = Type.Object({
  title: Type.String({ minLength: 1 }),
  description: Type.Optional(Type.String()),
  startTime: Type.String({ format: "date-time" }),
  endTime: Type.String({ format: "date-time" }),
  location: Type.Optional(Type.String()),
});
export type CreateEventInput = Static<typeof CreateEventSchema>;

export const UpdateEventSchema = Type.Partial(CreateEventSchema);
export type UpdateEventInput = Static<typeof UpdateEventSchema>;

export const EventParamsSchema = Type.Object({
  id: Type.String(),
});
export type EventParams = Static<typeof EventParamsSchema>;
