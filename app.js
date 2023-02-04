//set up the server
const express = require( "express" );
const logger = require("morgan");
const app = express();
const port = 8080;
const db = require('./db/db_connection');
// configure express to use ejs
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

app.use(logger("dev"));

app.use(express.static(__dirname + '/public'));

// Configure Express to parse URL-encoded POST request bodies (traditional forms)
app.use( express.urlencoded({ extended: false }) );

// define a route for the default home page
app.get( "/", ( req, res ) => {
    res.render("index");
} );

const read_stuff_all_sql = 'SELECT id, item, quantity, description FROM stuff'

// define a route for the stuff inventory page
app.get( "/invpage", ( req, res ) => {
    db.execute(read_stuff_all_sql, (error, results) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.render("invpage", {inventory: results});
        }
    });
    // res.sendFile( __dirname + "/views/invpage.html" );
} );

const read_item_sql = 'SELECT item, quantity, description FROM stuff WHERE id = ?'

// define a route for the item detail page
app.get( "/invpage/infopage/:id", ( req, res ) => {
    db.execute(read_item_sql, [req.params.id], (error, results) => {
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

const delete_item_sql = `DELETE FROM stuff WHERE id = ?`

//define a route for deleting an item
app.get("/invpage/item/:id/delete", (req, res) => {
    db.execute(delete_item_sql, [req.params.id], (error, results) => {
        if (error) {
            res.status(500).send(error);
        }
        else {
            res.redirect("/invpage");
        }
    })
});

const create_item_sql = `
    INSERT INTO stuff
        (item, quantity)
    VALUES
        (?, ?)
`

// start the server
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );