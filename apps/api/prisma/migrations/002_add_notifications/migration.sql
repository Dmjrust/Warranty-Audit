-- Create notifications table
CREATE TABLE notifications (
  id          TEXT        NOT NULL PRIMARY KEY,
  "tenantId"  TEXT        NOT NULL,
  "processId" TEXT,
  type        TEXT        NOT NULL,
  message     TEXT        NOT NULL,
  read        BOOLEAN     NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX notifications_tenant_read_idx ON notifications ("tenantId", read);
