//set up the server
const express = require( "express" );
const logger = require("morgan");
const helmet = require("helmet");
const fs = require("fs");
const app = express();
const { auth } = require('express-openid-connect');
const { requiresAuth } = require('express-openid-connect');
const dotenv = require('dotenv');
dotenv.config();
const port = process.env.PORT || 8080;
const db = require('./db/db_connection');
app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", 'cdnjs.cloudflare.com'],
      }
    }
})); 
// auth0
const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.AUTH0_BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
};

app.use(auth(config));
// configure express to use ejs
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(logger("dev"));

app.use(express.static(__dirname + '/public'));

// Configure Express to parse URL-encoded POST request bodies (traditional forms)
app.use( express.urlencoded({ extended: false }) );

// auth0
app.get('/authtest', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
  });
// middleware to check if user is logged in
app.use((req, res, next) => {
    res.locals.isLoggedIn = req.oidc.isAuthenticated();
    res.locals.user = req.oidc.user;
    next();
})
// define a route for the default home page
app.get( "/", ( req, res ) => {
    res.render("index");
} );

const read_stuff_all_sql = fs.readFileSync(__dirname + "/db/queries/init/read_inv_table.sql", { encoding: "UTF-8" })

// define a route for the stuff inventory page
app.get( "/invpage", requiresAuth(), ( req, res ) => {
    db.execute(read_stuff_all_sql, [req.oidc.user.email], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.render("invpage", {inventory: results});
        }
    });
    // res.sendFile( __dirname + "/views/invpage.html" );
} );

const read_item_sql = fs.readFileSync(__dirname + "/db/queries/init/read_item.sql", { encoding: "UTF-8" })

// define a route for the item detail page
app.get( "/invpage/infopage/:id", requiresAuth(), ( req, res ) => {
    db.execute(read_item_sql, [req.params.id, req.oidc.user.email], (error, results) => {
        if (error) {
            res.status(500).send(error);
        } 
        else if (results.length == 0) {
            res.status(404).send(`No item found with id = ${req.params.id}`);
        }
        else {
            res.render('infopage', results[0]);
        }
    });
    // res.sendFile( __dirname + "/views/infopage.html" );
} );

const delete_item_sql = fs.readFileSync(__dirname + "/db/queries/init/delete_item.sql", { encoding: "UTF-8" })

//define a route for deleting an item
app.get("/invpage/infopage/:id/delete", requiresAuth(), (req, res) => {
    db.execute(delete_item_sql, [req.params.id, req.oidc.user.email], (error, results) => {
        if (error) {
            res.status(500).send(error);
        }
        else {
            res.redirect("/invpage");
        }
    })
});

//auth0 stuff
app.get('/profile', requiresAuth(), (req, res) => {
    res.send(JSON.stringify(req.oidc.user));
  });

// define a route for item Create
const create_item_sql = fs.readFileSync(__dirname + "/db/queries/init/create_item.sql", { encoding: "UTF-8" })

app.post("/invpage", requiresAuth(), ( req, res ) => {
    db.execute(create_item_sql, [req.body.name, req.body.quantity, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            //results.insertId has the primary key (id) of the newly inserted element.
            res.redirect(`/invpage/infopage/${results.insertId}`);
        }
    });
})

// define a route for item UPDATE
const update_item_sql = fs.readFileSync(__dirname + "/db/queries/init/update_item.sql", { encoding: "UTF-8" })

app.post("/invpage/infopage/:id", requiresAuth(), ( req, res ) => {
    db.execute(update_item_sql, [req.body.name, req.body.quantity, req.body.description, req.params.id, req.oidc.user.email], (error, results) => {
        if (error)
            res.status(500).send(error); //Internal Server Error
        else {
            res.redirect(`/invpage/infopage/${req.params.id}`);
        }
    });
})

// start the server
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );