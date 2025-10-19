CREATE TABLE IF NOT EXISTS "template_variables" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" integer NOT NULL,
	"key" text NOT NULL,
	"type" text NOT NULL,
	"fallback_value" text,
	"is_required" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"content" jsonb NOT NULL,
	"html" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "templates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "template_variables_template_id_key_idx" ON "template_variables" ("template_id","key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "templates_updated_at_idx" ON "templates" ("updated_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_variables" ADD CONSTRAINT "template_variables_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
