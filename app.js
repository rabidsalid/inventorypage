//set up the server
const express = require( "express" );
const logger = require("morgan");
const app = express();
const port = 8080;

app.use(logger("dev"));

app.use(express.static(__dirname + '/public'));

// define a route for the default home page
app.get( "/", ( req, res ) => {
    res.sendFile( __dirname + "/views/index.html" );
} );

// define a route for the stuff inventory page
app.get( "/invpage", ( req, res ) => {
    res.sendFile( __dirname + "/views/invpage.html" );
} );

// define a route for the item detail page
app.get( "/invpage/infopage", ( req, res ) => {
    res.sendFile( __dirname + "/views/infopage.html" );
} );

// start the server
app.listen( port, () => {
    console.log(`App server listening on ${ port }. (Go to http://localhost:${ port })` );
} );