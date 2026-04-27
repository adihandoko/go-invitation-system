-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    image_url_1 TEXT NOT NULL DEFAULT '',
    image_url_2 TEXT NOT NULL DEFAULT '',
    image_url_3 TEXT NOT NULL DEFAULT '',
    event_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

ALTER TABLE invitations ADD COLUMN IF NOT EXISTS image_url_1 TEXT NOT NULL DEFAULT '';
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS image_url_2 TEXT NOT NULL DEFAULT '';
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS image_url_3 TEXT NOT NULL DEFAULT '';

-- Create index for slug
CREATE INDEX IF NOT EXISTS idx_invitations_slug ON invitations(slug);

-- Create rsvps table
CREATE TABLE IF NOT EXISTS rsvps (
    id SERIAL PRIMARY KEY,
    invitation_id INTEGER NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('attending', 'not_attending', 'maybe')),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Create index for invitation_id
CREATE INDEX IF NOT EXISTS idx_rsvps_invitation_id ON rsvps(invitation_id);

-- Create visitors table
CREATE TABLE IF NOT EXISTS visitors (
    id SERIAL PRIMARY KEY,
    invitation_id INTEGER NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL
);

-- Create index for invitation_id
CREATE INDEX IF NOT EXISTS idx_visitors_invitation_id ON visitors(invitation_id);
