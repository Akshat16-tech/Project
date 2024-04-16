var express  = require('express');
const { graphqlHTTP } = require('express-graphql');
const schema = require('./schema');
const resolvers = require('./resolvers');
var mongoose = require('mongoose');
var app      = express();
var database = require('./config/database');
var bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const path = require("path");

app.use(express.static(path.join(__dirname, 'public')));

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

app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: resolvers,
    graphiql: true // Enable GraphiQL interface for testing
  }));

const Movie = require('./models/schema');

const User = require('./models/User1'); // Assuming you have a User model

// Registration Page
app.get('/register', (req, res) => {
    res.render('partials/register');
});

// Handle user registration
app.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ username, password: hashedPassword, email });
        res.redirect('login');
    } catch (err) {
        console.error('Registration Error:', err);
        res.status(500).send('Registration failed');
    }
});

// Login Page
app.get('/login', (req, res) => {
    res.render('partials/login');
});

// Handle user login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).send('Invalid username or password');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send('Invalid username or password');
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true });
        res.redirect('movies');
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).send('Login failed');
    }
});


// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect('login');
    }
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.redirect('login');
        }
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.redirect('login');
        }
        req.user = user;
        next();
    });
}

// app.get('/api/movies', function(req, res) {
//     Movie.find()
//         .then(movies => {
//             res.json(movies);
//         })
//         .catch(err => {
//             res.status(400).send(err);
//         });
// });


app.get('/api/movies', authenticateToken , function(req, res) {
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

app.get('/movies/genre/:genre', (req, res) => {
    const { genre } = req.params;
    Movie.find({ genres: { $in: [genre] } }).lean()
        .then(movies => {
            res.render('partials/genre', { movies: movies });
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

    Movie.find({ title: { $regex: new RegExp(title, 'i') } }).lean()
        .skip((page - 1) * perPage)
        .limit(perPage)
        .then(movies => {
            // Render the movies.hbs template with the retrieved movies data
            res.render('partials/movies', {
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