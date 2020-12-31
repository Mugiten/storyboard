CREATE TABLE scene
(
	[sceneid] INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	[title] VARCHAR NOT NULL,
	[body] TEXT,
	[location] VARCHAR NOT NULL,
	[pov] VARCHAR NOT NULL, 
	[next_scene_id] INTEGER,
	FOREIGN KEY(next_scene_id) REFERENCES scene(sceneid)
);

CREATE TABLE character(
	[characterid] INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	[name] VARCHAR,
	[age] INTEGER,
	[sex] VARCHAR,
	[relationship] TEXT, 
	[history] TEXT,
	[abilities] TEXT

);

CREATE TABLE character_scene(
	[sceneid] INTEGER NOT NULL,
	[characterid] INTEGER NOT NULL,
	[current_status] VARCHAR, 
	[character_scene_id] INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	FOREIGN KEY(sceneid) REFERENCES scene(sceneid),
	FOREIGN KEY(characterid) REFERENCES character(characterid)
);

CREATE UNIQUE INDEX c_s_ux ON character_scene(sceneid, characterid);

