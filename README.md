# GeoJSON 到飞书多维表格导入工具

本工具能帮助您轻松地将 GeoJSON 文件中包含的地理空间数据导入到飞书（Lark）多维表格中，方便您在熟悉的业务环境中使用和分析这些数据。

## 主要功能

*   **轻松上传 GeoJSON**: 支持选择本地的 `.geojson` 或 `.json` 文件进行上传。
*   **数据智能解析**: 自动解析文件内容，提取地理要素及其属性信息。
*   **地理数据可视化**: 提供 WKT (Well-Known Text) 格式的几何图形预览，让数据更直观。
*   **字段灵活定义**: 自动分析 GeoJSON 中的属性字段，并允许您为这些字段设置在飞书表格中显示的别名。
*   **一键导入飞书**: 将解析和处理后的数据（包括几何图形的 WKT 字符串和自定义的属性字段）快速创建为飞书多维表格中的新数据表。

## 为何选择本工具？

*   **简化流程**: 无需复杂的手动转换或编码，一站式完成从 GeoJSON 到飞书表格的数据迁移。
*   **数据可控**: 在导入前即可预览地理数据和属性，并能自定义最终在表格中呈现的字段名，确保数据符合业务需求。
*   **高效管理**: 将地理空间信息与您的业务数据集中在飞书多维表格中管理，提升协作和分析效率。

## 如何使用

1.  **选择文件**: 点击“上传 GeoJSON 或 JSON 文件”按钮，选择您要处理的本地文件。
2.  **查看与调整字段 (可选)**: 文件上传并解析完成后，您可以在“字段分析与命名”部分查看从文件中提取的所有属性字段、它们被推断的数据类型，以及它们在飞书表格中的默认名称（即别名）。您可以按需修改这些别名。
3.  **指定飞书表名**: 在“导出到飞书多维表格”部分，为即将在飞书中创建的新数据表输入一个名称（默认为上传的文件名）。
4.  **开始导入**: 点击“在飞书中创建表格并添加记录”按钮。
5.  **完成**: 工具会自动在您的飞书空间中创建指定名称的表格，并将所有 GeoJSON 要素作为记录添加进去。每个要素的几何信息会以 WKT 字符串的形式保存在名为“WKT_Geometry”的列中，其他属性则根据您定义的别名成为独立的列。

---

## 开发者说明

### 安装与启动

1.  安装依赖:
    ```bash
    pnpm install
    ```
2.  本地开发环境运行:
    ```bash
    pnpm dev
    ```
3.  构建生产版本:
    ```bash
    pnpm build
    ```
