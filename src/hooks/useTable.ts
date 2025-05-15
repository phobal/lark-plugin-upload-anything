import { bitable, ViewType, FieldType } from '@lark-base-open/js-sdk'
import useSWR from 'swr'

export const useViewList = () => {
  const { data } = useSWR('getViewList', async () => {
    const currentTable = await bitable.base.getActiveTable()
    const allViewList = await currentTable.getViewMetaList()
    const currentView = await currentTable.getActiveView()
    const tableViewList = allViewList.filter((view) => view.type === ViewType.Grid)
    const viewList = tableViewList.map((view) => ({
      label: view.name,
      value: view.id,
    }))
    const currentViewIndex = viewList.findIndex((view) => view.value === currentView.id)
    const currentViewId = viewList[currentViewIndex].value
    return { viewList, currentViewId }
  })
  return { viewList: data?.viewList, currentViewId: data?.currentViewId }
}

export const useTableList = () => {
  const { data = [] } = useSWR('getTableList', async () => {
    const tables = await bitable.base.getTableList()
    const tableList = await Promise.all(
      tables.map(async (table) => {
        const name = await table.getName()
        return {
          label: name,
          value: table.id,
        }
      })
    )
    return tableList
  })
  return { tableList: data }
}

export const useViewData = (viewId: string, tableId?: string, refresh?: number) => {
  const {
    data: {
      numberOptions = [],
      stringOptions = [],
      lookupOptions = [],
      booleanOptions = [],
      singleOptions = [],
      multiOptions = [],
      urlOptions = [],
      phoneOptions = [],
      attachmentOptions = [],
      locationOptions = [],
      formulaOptions = [],
    } = {},
  } = useSWR(
    viewId ? [`getViewData-${viewId}`, viewId, tableId, refresh] : null,
    async ([_, viewId, tableId, refresh]) => {
      const currentTable = tableId ? await bitable.base.getTable(tableId) : await bitable.base.getActiveTable()
      const view = await currentTable.getViewById(viewId)
      const fieldList = await view.getFieldMetaList()
    const numberFieldList = fieldList.filter((field) => field.type === FieldType.Number)
    const stringFieldList = fieldList.filter((field) => field.type === FieldType.Text)
    const lookupFieldList = fieldList.filter((field) => field.type === FieldType.Lookup)
    const booleanFieldList = fieldList.filter((field) => field.type === FieldType.Checkbox)
    const singleFieldList = fieldList.filter((field) => field.type === FieldType.SingleSelect)
    const multiFieldList = fieldList.filter((field) => field.type === FieldType.MultiSelect)
    const urlFieldList = fieldList.filter((field) => field.type === FieldType.Url)
    const phoneFieldList = fieldList.filter((field) => field.type === FieldType.Phone)
    const attachmentFieldList = fieldList.filter((field) => field.type === FieldType.Attachment)
    const locationFieldList = fieldList.filter((field) => field.type === FieldType.Location)
    const formulaFieldList = fieldList.filter((field) => field.type === FieldType.Formula)
    const numberOptions = numberFieldList.map((field) => ({
      label: field.name,
      value: field.id,
    }))
    const stringOptions = stringFieldList.map((field) => ({
      label: field.name,
      value: field.id,
    }))
    const lookupOptions = lookupFieldList.map((field) => ({
      label: field.name,
      value: field.id,
    }))
    const booleanOptions = booleanFieldList.map((field) => ({
      label: field.name,
      value: field.id,
    }))
    const singleOptions = singleFieldList.map((field) => ({
      label: field.name,
      value: field.id,
    }))
    const multiOptions = multiFieldList.map((field) => ({
      label: field.name,
      value: field.id,
    }))
    const urlOptions = urlFieldList.map((field) => ({
      label: field.name,
      value: field.id,
    }))
    const phoneOptions = phoneFieldList.map((field) => ({
      label: field.name,
      value: field.id,
    }))
    const attachmentOptions = attachmentFieldList.map((field) => ({
      label: field.name,
      value: field.id,
    }))
    const locationOptions = locationFieldList.map((field) => ({
      label: field.name,
      value: field.id,
    }))
    const formulaOptions = formulaFieldList.map((field) => ({
      label: field.name,
      value: field.id,
    }))
    return {
      numberOptions,
      stringOptions,
      lookupOptions,
      booleanOptions,
      singleOptions,
      multiOptions,
      urlOptions,
      phoneOptions,
      attachmentOptions,
      locationOptions,
      formulaOptions,
    }
  })
  return {
    numberOptions,
    stringOptions,
    lookupOptions,
    booleanOptions,
    singleOptions,
    multiOptions,
    urlOptions,
    phoneOptions,
    attachmentOptions,
    locationOptions,
    formulaOptions,
  }
}
