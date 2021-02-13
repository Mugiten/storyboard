CREATE TABLE scene
(
	[sceneid] INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	[orderid] INTEGER NOT NULL, 
	[title] VARCHAR NOT NULL,
	[body] TEXT,
	[location] VARCHAR NOT NULL,
	[pov] VARCHAR NOT NULL, 
	[next_scene_id] INTEGER,
	[storyboardid] INTEGER NOT NULL, 
	FOREIGN KEY(next_scene_id) REFERENCES scene(sceneid),
	FOREIGN KEY(storyboardid) REFERENCES storyboard(storyboardid)
);

CREATE TABLE character(
	[characterid] INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	[name] VARCHAR,
	[age] INTEGER,
	[sex] VARCHAR,
	[relationship] TEXT, 
	[history] TEXT,
	[abilities] TEXT,
	[storyboardid] INTEGER NOT NULL,
	FOREIGN KEY(storyboardid) REFERENCES storyboard(storyboardid)
);

CREATE TABLE character_scene(
	[sceneid] INTEGER NOT NULL,
	[characterid] INTEGER NOT NULL,
	[current_status] VARCHAR, 
	[character_scene_id] INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
	FOREIGN KEY(sceneid) REFERENCES scene(sceneid),
	FOREIGN KEY(characterid) REFERENCES character(characterid)
);

CREATE TABLE storyboard(
	[storyboardid] INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, 
	[name] VARCHAR NOT NULL, 
	[author] VARCHAR NOT NULL,
	[userid] INTEGER NOT NULL,
	FOREIGN KEY(userid) REFERENCES users(id)
);

CREATE TABLE users(
	[id] INTEGER PRIMARY KEY AUTOINCREMENT,
	[profileid] TEXT,
	[email] TEXT,
	[username] TEXT
);

CREATE UNIQUE INDEX c_s_ux ON character_scene(sceneid, characterid);

