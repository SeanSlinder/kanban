exports.up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    email: { type: "text", notNull: true, unique: true },
    passwordHash: { type: "text", notNull: true },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("boards", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    title: { type: "text", notNull: true },
    user_id: { type: "uuid", references: "users", onDelete: "cascade" },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("lists", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    title: { type: "text", notNull: true },
    position: { type: "integer", notNull: false },
    board_id: { type: "uuid", references: "boards", onDelete: "cascade" },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  pgm.createTable("cards", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },
    title: { type: "text", notNull: true },
    description: { type: "text" },
    position: { type: "integer" },
    list_id: { type: "uuid", references: "lists", onDelete: "cascade" },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("cards");
  pgm.dropTable("lists");
  pgm.dropTable("boards");
  pgm.dropTable("users");
};
