const Movie = require('./models/schema');

const resolvers = {
  getMovieById: async ({ _id }) => {
    return await Movie.findById(_id);
  },
  searchMovies: async ({ title }) => {
    return await Movie.find({ title: { $regex: new RegExp(title, 'i') } });
  },
  getAllMovies: async () => {
    return await Movie.find();
  },
  createMovie: async ({ input }) => {
    return await Movie.create(input);
  },
  updateMovie: async ({ _id, input }) => {
    return await Movie.findByIdAndUpdate(_id, input, { new: true });
  },
  deleteMovie: async ({ _id }) => {
    await Movie.findByIdAndDelete(_id);
    return "Movie deleted successfully";
  }
};

module.exports = resolvers;