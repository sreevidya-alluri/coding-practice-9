const express = require('express')
const sqlite3 = require('sqlite3')
const path = require('path')
const {open} = require('sqlite')
const app = express()
const bcrypt = require('bcrypt')
const dbPath = path.join(__dirname, 'userData.db')
let db = null
app.use(express.json())

const initialize = async (request, response) => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log(`Server running at http://localhost:3000/`)
    })
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
    process.exit(1)
  }
}
initialize()

app.post('/register', async (request, response) => {
  let {username, name, password, gender, location} = request.body //Destructuring the data from the API call

  let hashedPassword = await bcrypt.hash(password, 10) //Hashing the given password

  let checkTheUsername = `
            SELECT *
            FROM user
            WHERE username = '${username}';`
  let userData = await db.get(checkTheUsername) //Getting the user details from the database
  if (userData === undefined) {
    //checks the condition if user is already registered or not in the database
    /*If userData is not present in the database then this condition executes*/
    let postNewUserQuery = `
            INSERT INTO
            user (username,name,password,gender,location)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );`
    if (password.length < 5) {
      //checking the length of the password
      response.status(400)
      response.send('Password is too short')
    } else {
      /*If password length is greater than 5 then this block will execute*/

      let newUserDetails = await db.run(postNewUserQuery) //Updating data to the database
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    /*If the userData is already registered in the database then this block will execute*/
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectedUserQuery = `SELECT * FROM user WHERE username='${username}'`
  const dbUser = await db.get(selectedUserQuery)

  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`
  const databaseUser = await database.get(selectUserQuery)
  if (databaseUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      databaseUser.password,
    )
    if (isPasswordMatched === true) {
      if (validatePassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `
          UPDATE
            user
          SET
            password = '${hashedPassword}'
          WHERE
            username = '${username}';`

        const user = await database.run(updatePasswordQuery)

        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
