import { FilterQuery, Query } from 'mongoose'

const buildQuery = async <T>(
  modelQuery: Query<T[], T>,
  query: Record<string, unknown>,
  searchAbleFields: string[],
) => {
  // searchQuery
  let queryConstructor = modelQuery.find()

  // serviceId to service if provided
  if (query['productId']) {
    query['service'] = query['productId']
    delete query['productId']
  }

  let searchTerm = ''
  if (query?.searchTerm) {
    searchTerm = query?.searchTerm as string
    queryConstructor = queryConstructor.find({
      $or: searchAbleFields.map(field => ({
        [field]: { $regex: searchTerm, $options: 'i' },
      })),
    } as FilterQuery<T>)
  }

  // filter query
  const queryObj = { ...query }
  const excludesFields = [
    'searchTerm',
    'sort',
    'limit',
    'page',
    'skip',
    'fields',
  ]
  excludesFields.forEach(ele => delete queryObj[ele])
  queryConstructor = queryConstructor.find(queryObj as FilterQuery<T>)

  // sort query
  let sort = '-createdAt'
  if (query?.sort) {
    sort = (query?.sort as string).split(',').join(' ')
    queryConstructor = queryConstructor.sort(sort)
  }

  // paginate query
  let limit = 1
  let page = 1
  let skip = 0
  if (query?.limit) {
    limit = Number(query?.limit)
    queryConstructor = queryConstructor.limit(limit)
  }
  if (query?.page) {
    page = Number(query?.page)
    skip = (page - 1) * limit
    queryConstructor = queryConstructor.skip(skip)
  }

  // fields filtering
  let fields = '-__v'
  if (query?.fields) {
    fields = (query?.fields as string).split(',').join(' ')
    queryConstructor = queryConstructor.select(fields)
  }

  return queryConstructor
}

export default buildQuery;
