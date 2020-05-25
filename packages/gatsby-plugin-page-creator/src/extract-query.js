import _ from "lodash"

// Input queryStringParent could be:
//   Product
//   allProduct
//   allProduct(filter: thing)
// End result should be something like { allProducts { nodes { id }}}
export function generateQueryFromString(
  queryStringParent: string,
  fileAbsolutePath: string
): string {
  const needsAllPrefix = queryStringParent.startsWith(`all`) === false
  let fields = extractUrlParamsForQuery(fileAbsolutePath)

  return `{${
    needsAllPrefix ? `all` : ``
  }${queryStringParent}{nodes{${fields}}}}`
}

export function reverseLookupParams(
  queryResults: string,
  absolutePath: string
): Record<string, string> {
  const reversedParams = {}
  const parts = absolutePath.split(`/`).filter(s => s.startsWith(`[`))

  parts.forEach(part => {
    const extracted = /^\[([a-zA-Z_]+)\]/.exec(part)[1]
    const results = _.get(queryResults, extracted.replace(/__/g, "."))
    reversedParams[extracted] = results
  })

  return reversedParams
}

// Changes something like
//   `/Users/site/src/pages/foo/[id]/[baz]`
// to
//   `id,baz`
function extractUrlParamsForQuery(createdPath: string): string {
  const parts = createdPath.split(`/`)
  return parts
    .reduce((queryParts, part) => {
      if (part.startsWith(`[`)) {
        return queryParts.concat(
          deriveNesting(
            part.replace(`[`, ``).replace(`]`, ``).replace(`.js`, ``)
          )
        )
      }

      return queryParts
    }, [])
    .join(`,`)
}

function deriveNesting(part: string): string {
  if (part.includes(`__`)) {
    return part
      .split(`__`)
      .reverse()
      .reduce((path, part) => {
        if (path) {
          return `${part}{${path}}`
        }
        return `${part}${path}`
      }, ``)
  }
  return part
}