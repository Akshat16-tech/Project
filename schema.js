const { buildSchema } = require('graphql');

const schema = buildSchema(`
  type Movie {
    _id: ID!
    title: String!
    plot: String
    genres: [String]
    runtime: Int
    cast: [String]
    num_mflix_comments: Int
    released: String
    rated: String
    year: Int
    imdb: IMDB
  }

  type IMDB {
    rating: Float
    votes: Int
    id: Int
  }

  input MovieInput {
    title: String!
    plot: String
    genres: [String]
    runtime: Int
    cast: [String]
    num_mflix_comments: Int
    released: String
    rated: String
    year: Int
    imdb: IMDBInput
  }

  input IMDBInput {
    rating: Float
    votes: Int
    id: Int
  }

  type Query {
    getMovieById(_id: ID!): Movie
    searchMovies(title: String!): [Movie]
    getAllMovies: [Movie]
  }

  type Mutation {
    createMovie(input: MovieInput!): Movie
    updateMovie(_id: ID!, input: MovieInput!): Movie
    deleteMovie(_id: ID!): String
  }
`);

module.exports = schema;