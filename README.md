## Rubix API

Documentation of the API.

---

## Current version: 1

Prefix requests with /v1

All requests require a `Authorisation` header.

---

## GET `/guilds/@me`

> **NOT IMPLEMENTED**

Get a list of guilds the user is currently in and has permission to manage. Cached for 1 minute.

### Returns

```json
[
  {
    "name": "",
    "id": "",
    "roles": [{ "name": "", "id": "", "color": "", "permissions": "" }],
    "icon": ""
  }
]
```

---

## GET `/guilds/:id`

Get a guild information. Cached for 1 minute.

### Returns:

```json
{
  "name": "",
  "id": "",
  "channels": [{ "name": "", "id": "", "type": 0 }],
  "roles": [{ "name": "", "id": "", "color": "", "permissions": "" }],
  "icon": ""
}
```

### Errors:

Guild ID was not found (bot not there).

```json
{ "error": "Guild not found" }
```

---

## GET `/guilds/:id/settings`

Get a guilds settings. All fields are nullable.

### Returns:

```json
{
  "modlog_channel": "",
  "greeting": {
    "enabled": true,
    "message": "",
    "channelID": ""
  },
  "farewell": {
    "enabled": true,
    "message": "",
    "channelID": ""
  }
}
```

### Errors:

User doesn't have permission to view settings.

```json
{ "error": "Unauthorised" }
```

---

## POST `/guilds/:id/settings`

Sets a guilds settings. No body fields are required.

### Body:

```json
{
  "modlog_channel": "",
  "greeting": {
    "enabled": true,
    "message": "",
    "channelID": ""
  },
  "farewell": {
    "enabled": true,
    "message": "",
    "channelID": ""
  }
}
```

### Returns:

```json
{
  "success": true
}
```

### Errors:

User doesn't have permission to set settings.

```json
{ "error": "Unauthorised" }
```

---

## GET `/guilds/:id/custom-commands`

> **NOT IMPLEMENTED**

### Returns:

```json
[
  {
    "name": "",
    "creator": "",
    "message": ""
  }
]
```

---

## POST `/guilds:id/custom-commands`

> **NOT IMPLEMENTED**

Create a new custom command.

### Body:

```js
{
  message: String,
  name: String
}
```

### Returns:

```json
{ "success": true }
```

### Errors:

Command name is the same as a core command.

```json
{ "error": "Core command already exists" }
```

Command name is the same as a pre-existing custom command.

```json
{ "error": "Custom command already exists" }
```
