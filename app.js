var express  = require('express');
var mongoose = require('mongoose');
var app      = express();
var database = require('./config/database');
var bodyParser = require('body-parser');


const exphbs = require('express-handlebars');
app.engine(
    "hbs",
    exphbs.engine({
      extname: ".hbs",
      defaultLayout: 'main'
    })
  );
app.set('view engine', 'hbs');
 
var port     = process.env.PORT || 8000;
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

mongoose.connect(database.url);

const Movie = require('./models/schema');

// app.get('/api/movies', function(req, res) {
//     Movie.find()
//         .then(movies => {
//             res.json(movies);
//         })
//         .catch(err => {
//             res.status(400).send(err);
//         });
// });


app.get('/api/movies', function(req, res) {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 20;
    const title = req.query.title;

    console.log('movies requested');
    let query = {};

    if (title) {
        query.title = { $regex: new RegExp(title, 'i') };
    }

    Movie.find(query).lean()
        .skip((page - 1) * perPage)
        .limit(perPage)
        .then(movies => {
            res.json(movies);
        })
        .catch(err => {
            console.error('Error:', err);
            res.status(400).send(err);
        });
});


app.get('/movies', (req, res) => {
    let { page, perPage, title } = req.query;
    page = parseInt(page) || 1;
    perPage = parseInt(perPage) || 20;

    console.log('GET /movies requested');

    Movie.find({ title: { $regex: new RegExp(title, 'i') } })
        .skip((page - 1) * perPage)
        .limit(perPage)
        .then(movies => {
            // Render the movies template
            res.render('movies', {
                movies: movies,
                page: page,
                perPage: perPage,
                title: title
            });
        })
        .catch(err => {
            console.error('Error:', err);
            res.status(400).send(err);
        });
});



app.get('/api/movies/:movieId', function(req, res) {
    console.log(req.params);
    Movie.findOne({ $or: [{ _id: req.params.movieId }] })
        .then(movie => {
            if (!movie) {
                return res.status(404).send('Movie not found');
            }
            res.json(movie);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});

// Create a new movie
app.post('/api/movies', (req, res) => {
    const { title, plot, genres, runtime, cast, fullplot, languages, released, directors, rated, awards, lastupdated, year, imdb, countries, tomatoes, num_mflix_comments } = req.body;
    Movie.create({ title, plot, genres, runtime, cast, fullplot, languages, released, directors, rated, awards, lastupdated, year, imdb, countries, tomatoes, num_mflix_comments })
        .then(movie => {
            return Movie.find();
        })
        .then(allMovies => {
            res.json({ allMovies });
        })
        .catch(err => {
            res.status(400).send(err);
        });
});

// Update an existing movie
app.put('/api/movies/:movieId', (req, res) => {
    const { title, plot, genres, runtime, cast, fullplot, languages, released, directors, rated, awards, lastupdated, year, imdb, countries, tomatoes, num_mflix_comments } = req.body;
    Movie.findByIdAndUpdate(req.params.movieId, { title, plot, genres, runtime, cast, fullplot, languages, released, directors, rated, awards, lastupdated, year, imdb, countries, tomatoes, num_mflix_comments })
        .then(movie => {
            if (!movie) {
                return res.status(404).send('Movie not found');
            }
            res.send(`Successfully! Movie updated - ${movie.title}`);
        })
        .catch(err => {
            res.status(400).send(err);
        });
});

// Delete a movie by ID
app.delete('/api/movies/:movieId', (req, res) => {
    Movie.findOneAndDelete(req.params.movieId)
        .then(movie => {
            if (!movie) {
                return res.status(404).send('Movie not found');
            }
            res.send('Successfully! Movie has been Deleted.');
        })
        .catch(err => {
            res.status(400).send(err);
        });
});


app.listen(port, () => console.log(`App listening on port ${port}`));