const graphql = require("graphql");
const {
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
} = graphql;
const axios = require("axios");

const CompanyType = new GraphQLObjectType({
  name: "Company",
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    description: { type: GraphQLString },
    users: {
      type: new GraphQLList(UserType),
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${parentValue.id}/users`)
          .then((resp) => resp.data);
      },
    },
  }),
});

// Instruct graphql that our application has the concept of a user.  Two required properties - name (always be a string that describes the type we are defining), fields (diff props a user has).
const UserType = new GraphQLObjectType({
  name: "User",
  fields: () => ({
    id: { type: GraphQLString },
    firstName: { type: GraphQLString },
    age: { type: GraphQLInt },
    company: {
      type: CompanyType,
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${parentValue.companyId}`)
          .then((resp) => resp.data);
      },
    },
  }),
});

// Specific Node - here if you are looking for a user, provided the id, graphql will return a user of type UserType.
const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    user: {
      type: UserType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/users/${args.id}`)
          .then((resp) => resp.data); // resp returned { data: { firstName: 'bill' }} but we only want the data.
      },
    },
    company: {
      type: CompanyType,
      args: { id: { type: GraphQLString } },
      resolve(parentValue, args) {
        return axios
          .get(`http://localhost:3000/companies/${args.id}`)
          .then((resp) => resp.data);
      },
    },
  },
});

const mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addUser: {
      type: UserType,
      args: {
        firstName: { type: new GraphQLNonNull(GraphQLString) },
        age: { type: new GraphQLNonNull(GraphQLInt) },
        companyId: { type: GraphQLString },
      },
      resolve(parentValue, { firstName, age }) {
        return axios
          .post(`http://localhost:3000/users`, { firstName, age })
          .then((resp) => resp.data);
      },
    },
    deleteUser: {
      type: UserType,
      args: { id: { type: new GraphQLNonNull(GraphQLString) } },
      resolve(parentValue, { id }) {
        return axios
          .delete(`http://localhost:3000/users/${id}`)
          .then((resp) => resp.data);
      },
    },
    editUser: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        firstName: { type: GraphQLString },
        age: { type: GraphQLInt },
        companyId: { type: GraphQLString },
      },
      resolve(parentValue, args) {
        return axios
          .patch(`http://localhost:3000/users/${args.id}`, args)
          .then((resp) => resp.data);
      },
    },
  },
});

// GraphQLSchema takes in a root query and returns a GraphQL schema instance
module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: mutation,
});

/*
  Schema - inform graphQL how our data in our application is arranged

  resolve(parentValue, args) - purpose is to get the data from our data source.  resolve() can return a promise.
    If we return a promise from the resolve() function, graphQL will automatically detect that we've returned
    a promise, wait for the promise to resolve, then when it does, grab the data that it resolved with, and send
    a response back tot he user.

  parentValue - rarely used
  args - arguments passed into the original query
*/

/* Ref using static list of users
  const _ = require("lodash");

  // Static list for test
  const users = [
    { id: "23", firstName: "Bill", age: 20 },
    { id: "47", firstName: "Samantha", age: 21 },
  ];


  const RootQuery = new GraphQLObjectType({
    name: "RootQueryType",
    fields: {
      user: {
        type: UserType,
        args: { id: { type: GraphQLString } },
        resolve(parentValue, args) {
          return _.find(users, { id: args.id }); // expect to return raw JSON or raw JS object { id: '23', firstName: 'Bill', age: 20 }
          // return users.find((user) => user.id === args.id);
        },
      },
    },
  });
*/
