import flatten from 'lodash.flatten'
import createBuildActions from './utils/create-build-actions'
import createMapActionGroup from './utils/create-map-action-group'
import { actionsMapBase } from './cart-discounts-actions'
import * as diffpatcher from './utils/diffpatcher'

export const actionGroups = ['base']

function createCartDiscountsMapActions (mapActionGroup) {
  return function doMapActions (diff, newObj, oldObj) {
    const allActions = []

    allActions.push(
      mapActionGroup('base', () => actionsMapBase(diff, oldObj, newObj)),
    )

    return flatten(allActions)
  }
}

export default (config) => {
  const mapActionGroup = createMapActionGroup(config)
  const doMapActions = createCartDiscountsMapActions(mapActionGroup)
  const buildActions = createBuildActions(diffpatcher.diff, doMapActions)
  return { buildActions }
}
