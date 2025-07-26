
// DEFAULT CODE
// use helix_db::helix_engine::graph_core::config::Config;

// pub fn config() -> Option<Config> {
//     None
// }



use heed3::RoTxn;
use helix_macros::{handler, tool_call, mcp_handler};
use helix_db::{
    helix_engine::{
        graph_core::{
            config::{Config, GraphConfig, VectorConfig},
            ops::{
                bm25::search_bm25::SearchBM25Adapter,
                g::G,
                in_::{in_::InAdapter, in_e::InEdgesAdapter, to_n::ToNAdapter, to_v::ToVAdapter},
                out::{
                    from_n::FromNAdapter, from_v::FromVAdapter, out::OutAdapter, out_e::OutEdgesAdapter,
                },
                source::{
                    add_e::{AddEAdapter, EdgeType},
                    add_n::AddNAdapter,
                    e_from_id::EFromIdAdapter,
                    e_from_type::EFromTypeAdapter,
                    n_from_id::NFromIdAdapter,
                    n_from_index::NFromIndexAdapter,
                    n_from_type::NFromTypeAdapter,
                },
                tr_val::{Traversable, TraversalVal},
                util::{
                    dedup::DedupAdapter, drop::Drop, exist::Exist, filter_mut::FilterMut,
                    filter_ref::FilterRefAdapter, map::MapAdapter, paths::ShortestPathAdapter,
                    props::PropsAdapter, range::RangeAdapter, update::UpdateAdapter,
                },
                vectors::{
                    brute_force_search::BruteForceSearchVAdapter, insert::InsertVAdapter,
                    search::SearchVAdapter,
                },
            }
        },
        types::GraphError,
        vector_core::vector::HVector,
    },
    helix_gateway::{
        embedding_providers::embedding_providers::{EmbeddingModel, get_embedding_model},
        router::router::HandlerInput,
        mcp::mcp::{MCPHandlerSubmission, MCPToolInput, MCPHandler}
    },
    node_matches, props, embed,
    field_remapping, identifier_remapping, 
    traversal_remapping, exclude_field, value_remapping, 
    protocol::{
        remapping::{Remapping, RemappingMap, ResponseRemapping},
        response::Response,
        return_values::ReturnValue,
        value::Value,
        format::Format,
    },
    utils::{
        count::Count,
        filterable::Filterable,
        id::ID,
        items::{Edge, Node},
    },
};
use sonic_rs::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use std::time::Instant;
use chrono::{DateTime, Utc};
    
pub fn config() -> Option<Config> {return Some(Config {vector_config: Some(VectorConfig {m: Some(16),ef_construction: Some(768),ef_search: Some(768),}),graph_config: Some(GraphConfig {secondary_indices: Some(vec![]),}),db_max_size_gb: Some(10),mcp: Some(true),bm25: Some(true),schema: None,embedding_model: None,graphvis_node_label: None,})}
pub struct Root {
    pub name: String,
    pub extracted_at: DateTime<Utc>,
}

pub struct Folder {
    pub name: String,
    pub extracted_at: DateTime<Utc>,
}

pub struct File {
    pub name: String,
    pub extension: String,
    pub text: String,
    pub extracted_at: DateTime<Utc>,
}

pub struct Entity {
    pub entity_type: String,
    pub start_byte: i64,
    pub end_byte: i64,
    pub order: i64,
    pub text: String,
    pub extracted_at: DateTime<Utc>,
}

pub struct Root_to_Folder {
    pub from: Root,
    pub to: Folder,
}

pub struct Root_to_File {
    pub from: Root,
    pub to: File,
}

pub struct Folder_to_Folder {
    pub from: Folder,
    pub to: Folder,
}

pub struct Folder_to_File {
    pub from: Folder,
    pub to: File,
}

pub struct File_to_Entity {
    pub from: File,
    pub to: Entity,
}

pub struct Entity_to_Entity {
    pub from: Entity,
    pub to: Entity,
}

pub struct Entity_to_EmbededCode {
    pub from: Entity,
    pub to: EmbededCode,
}

pub struct EmbededCode {
    pub vector: Vec<f64>,
}

#[derive(Serialize, Deserialize)]
pub struct getFileRootInput {

pub file_id: ID
}
#[handler(with_read)]
pub fn getFileRoot (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let root = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.file_id)

.in_("Root_to_File",&EdgeType::Node).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("root".to_string(), ReturnValue::from_traversal_value_array_with_mixin(root.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getFileContentInput {

pub file_id: ID
}
#[handler(with_read)]
pub fn getFileContent (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let file = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.file_id).collect_to_obj();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("file".to_string(), ReturnValue::from_traversal_value_with_mixin(G::new_from(Arc::clone(&db), &txn, file.clone())

.check_property("text").collect_to_obj().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct createSuperFileInput {

pub root_id: ID,
pub name: String,
pub extension: String,
pub text: String
}
#[handler(with_write)]
pub fn createSuperFile (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let root = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.root_id).collect_to_obj();
    let file = G::new_mut(Arc::clone(&db), &mut txn)
.add_n("File", Some(props! { "name" => &data.name, "extracted_at" => chrono::Utc::now().to_rfc3339(), "text" => &data.text, "extension" => &data.extension }), None).collect_to_obj();
    G::new_mut(Arc::clone(&db), &mut txn)
.add_e("Root_to_File", None, root.id(), file.id(), true, EdgeType::Node).collect_to_obj();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("file".to_string(), ReturnValue::from_traversal_value_with_mixin(file.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getEntityFileInput {

pub entity_id: ID
}
#[handler(with_read)]
pub fn getEntityFile (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let file = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.entity_id)

.in_("File_to_Entity",&EdgeType::Node).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("file".to_string(), ReturnValue::from_traversal_value_array_with_mixin(G::new_from(Arc::clone(&db), &txn, file.clone())

.map_traversal(|item, txn| { exclude_field!(remapping_vals, item.clone(), "text")?;
 Ok(item) }).collect_to::<Vec<_>>().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getSuperEntityInput {

pub entity_id: ID
}
#[handler(with_read)]
pub fn getSuperEntity (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let entity = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.entity_id)

.in_("Entity_to_Entity",&EdgeType::Node).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("entity".to_string(), ReturnValue::from_traversal_value_array_with_mixin(entity.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getFolderFilesInput {

pub folder_id: ID
}
#[handler(with_read)]
pub fn getFolderFiles (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let files = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.folder_id)

.out("Folder_to_File",&EdgeType::Node).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("files".to_string(), ReturnValue::from_traversal_value_array_with_mixin(G::new_from(Arc::clone(&db), &txn, files.clone())

.map_traversal(|item, txn| { exclude_field!(remapping_vals, item.clone(), "text")?;
 Ok(item) }).collect_to::<Vec<_>>().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getSuperFoldersInput {

pub folder_id: ID
}
#[handler(with_read)]
pub fn getSuperFolders (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let folders = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.folder_id)

.in_("Folder_to_Folder",&EdgeType::Node).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("folders".to_string(), ReturnValue::from_traversal_value_array_with_mixin(folders.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getFolderRootInput {

pub folder_id: ID
}
#[handler(with_read)]
pub fn getFolderRoot (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let root = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.folder_id)

.in_("Root_to_Folder",&EdgeType::Node).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("root".to_string(), ReturnValue::from_traversal_value_array_with_mixin(root.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct createSubEntityInput {

pub entity_id: ID,
pub entity_type: String,
pub start_byte: i64,
pub end_byte: i64,
pub order: i64,
pub text: String
}
#[handler(with_write)]
pub fn createSubEntity (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let parent = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.entity_id).collect_to_obj();
    let entity = G::new_mut(Arc::clone(&db), &mut txn)
.add_n("Entity", Some(props! { "order" => &data.order, "entity_type" => &data.entity_type, "text" => &data.text, "extracted_at" => chrono::Utc::now().to_rfc3339(), "end_byte" => &data.end_byte, "start_byte" => &data.start_byte }), None).collect_to_obj();
    G::new_mut(Arc::clone(&db), &mut txn)
.add_e("Entity_to_Entity", None, parent.id(), entity.id(), true, EdgeType::Node).collect_to_obj();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("entity".to_string(), ReturnValue::from_traversal_value_with_mixin(entity.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getSubFoldersInput {

pub folder_id: ID
}
#[handler(with_read)]
pub fn getSubFolders (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let subfolders = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.folder_id)

.out("Folder_to_Folder",&EdgeType::Node).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("subfolders".to_string(), ReturnValue::from_traversal_value_array_with_mixin(subfolders.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getFileByNameInput {

pub name: String
}
#[handler(with_read)]
pub fn getFileByName (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let file = G::new(Arc::clone(&db), &txn)
.n_from_type("File")

.filter_ref(|val, txn|{
                if let Ok(val) = val { 
                    Ok(G::new_from(Arc::clone(&db), &txn, val.clone())

.check_property("name")

.map_value_or(false, |v| *v == data.name.clone())?)
                } else {
                    Ok(false)
                }
            }).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("file".to_string(), ReturnValue::from_traversal_value_array_with_mixin(G::new_from(Arc::clone(&db), &txn, file.clone())

.map_traversal(|item, txn| { exclude_field!(remapping_vals, item.clone(), "text")?;
 Ok(item) }).collect_to::<Vec<_>>().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getFolderByNameInput {

pub name: String
}
#[handler(with_read)]
pub fn getFolderByName (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let folder = G::new(Arc::clone(&db), &txn)
.n_from_type("Folder")

.filter_ref(|val, txn|{
                if let Ok(val) = val { 
                    Ok(G::new_from(Arc::clone(&db), &txn, val.clone())

.check_property("name")

.map_value_or(false, |v| *v == data.name.clone())?)
                } else {
                    Ok(false)
                }
            }).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("folder".to_string(), ReturnValue::from_traversal_value_array_with_mixin(folder.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getAllFilesInput {


}
#[handler(with_read)]
pub fn getAllFiles (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let files = G::new(Arc::clone(&db), &txn)
.n_from_type("File").collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("files".to_string(), ReturnValue::from_traversal_value_array_with_mixin(G::new_from(Arc::clone(&db), &txn, files.clone())

.map_traversal(|item, txn| { exclude_field!(remapping_vals, item.clone(), "text")?;
 Ok(item) }).collect_to::<Vec<_>>().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct createSuperFolderInput {

pub root_id: ID,
pub name: String
}
#[handler(with_write)]
pub fn createSuperFolder (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let root = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.root_id).collect_to_obj();
    let folder = G::new_mut(Arc::clone(&db), &mut txn)
.add_n("Folder", Some(props! { "name" => &data.name, "extracted_at" => chrono::Utc::now().to_rfc3339() }), None).collect_to_obj();
    G::new_mut(Arc::clone(&db), &mut txn)
.add_e("Root_to_Folder", None, root.id(), folder.id(), true, EdgeType::Node).collect_to_obj();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("folder".to_string(), ReturnValue::from_traversal_value_with_mixin(folder.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct createFileInput {

pub folder_id: ID,
pub name: String,
pub extension: String,
pub text: String
}
#[handler(with_write)]
pub fn createFile (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let folder = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.folder_id).collect_to_obj();
    let file = G::new_mut(Arc::clone(&db), &mut txn)
.add_n("File", Some(props! { "text" => &data.text, "extension" => &data.extension, "name" => &data.name, "extracted_at" => chrono::Utc::now().to_rfc3339() }), None).collect_to_obj();
    G::new_mut(Arc::clone(&db), &mut txn)
.add_e("Folder_to_File", None, folder.id(), file.id(), true, EdgeType::Node).collect_to_obj();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("file".to_string(), ReturnValue::from_traversal_value_with_mixin(file.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getRootByIdInput {

pub root_id: ID
}
#[handler(with_read)]
pub fn getRootById (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let root = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.root_id).collect_to_obj();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("root".to_string(), ReturnValue::from_traversal_value_with_mixin(root.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getSubEntitiesInput {

pub entity_id: ID
}
#[handler(with_read)]
pub fn getSubEntities (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let entities = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.entity_id)

.out("Entity_to_Entity",&EdgeType::Node).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("entities".to_string(), ReturnValue::from_traversal_value_array_with_mixin(entities.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct deleteFolderInput {

pub folder_id: ID
}
#[handler(with_write)]
pub fn deleteFolder (input: &HandlerInput) -> Result<Response, GraphError> {
{
    Drop::<Vec<_>>::drop_traversal(
                G::new(Arc::clone(&db), &txn)
.n_from_id(&data.folder_id)

.in_e("Folder_to_Folder").collect_to::<Vec<_>>(),
                Arc::clone(&db),
                &mut txn,
            )?;;
    Drop::<Vec<_>>::drop_traversal(
                G::new(Arc::clone(&db), &txn)
.n_from_id(&data.folder_id)

.in_e("Root_to_Folder").collect_to::<Vec<_>>(),
                Arc::clone(&db),
                &mut txn,
            )?;;
    Drop::<Vec<_>>::drop_traversal(
                G::new(Arc::clone(&db), &txn)
.n_from_id(&data.folder_id).collect_to_obj(),
                Arc::clone(&db),
                &mut txn,
            )?;;
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("success".to_string(), ReturnValue::from(Value::from("success")));

}
}

#[derive(Serialize, Deserialize)]
pub struct embedSuperEntityInput {

pub entity_id: ID,
pub vector: Vec<f64>
}
#[handler(with_write)]
pub fn embedSuperEntity (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let entity = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.entity_id).collect_to_obj();
    let embeded_code = G::new_mut(Arc::clone(&db), &mut txn)
.insert_v::<fn(&HVector, &RoTxn) -> bool>(&data.vector, "EmbededCode", None).collect_to_obj();
    G::new_mut(Arc::clone(&db), &mut txn)
.add_e("Entity_to_EmbededCode", None, entity.id(), embeded_code.id(), true, EdgeType::Node).collect_to_obj();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("embeded_code".to_string(), ReturnValue::from_traversal_value_with_mixin(embeded_code.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getRootInput {


}
#[handler(with_read)]
pub fn getRoot (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let root = G::new(Arc::clone(&db), &txn)
.n_from_type("Root").collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("root".to_string(), ReturnValue::from_traversal_value_array_with_mixin(root.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct createSuperEntityInput {

pub file_id: ID,
pub entity_type: String,
pub start_byte: i64,
pub end_byte: i64,
pub order: i64,
pub text: String
}
#[handler(with_write)]
pub fn createSuperEntity (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let file = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.file_id).collect_to_obj();
    let entity = G::new_mut(Arc::clone(&db), &mut txn)
.add_n("Entity", Some(props! { "entity_type" => &data.entity_type, "order" => &data.order, "extracted_at" => chrono::Utc::now().to_rfc3339(), "start_byte" => &data.start_byte, "text" => &data.text, "end_byte" => &data.end_byte }), None).collect_to_obj();
    G::new_mut(Arc::clone(&db), &mut txn)
.add_e("File_to_Entity", None, file.id(), entity.id(), true, EdgeType::Node).collect_to_obj();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("entity".to_string(), ReturnValue::from_traversal_value_with_mixin(entity.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getFileEntitiesInput {

pub file_id: ID
}
#[handler(with_read)]
pub fn getFileEntities (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let entity = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.file_id)

.out("File_to_Entity",&EdgeType::Node).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("entity".to_string(), ReturnValue::from_traversal_value_array_with_mixin(entity.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct searchSuperEntityInput {

pub vector: Vec<f64>,
pub k: i64
}
#[handler(with_read)]
pub fn searchSuperEntity (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let vectors = G::new(Arc::clone(&db), &txn)
.search_v::<fn(&HVector, &RoTxn) -> bool>(&data.vector, data.k as usize, None).collect_to::<Vec<_>>();
    let entity = G::new_from(Arc::clone(&db), &txn, vectors.clone())

.in_("Entity_to_EmbededCode",&EdgeType::Node).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("entity".to_string(), ReturnValue::from_traversal_value_array_with_mixin(entity.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getAllFoldersInput {


}
#[handler(with_read)]
pub fn getAllFolders (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let folders = G::new(Arc::clone(&db), &txn)
.n_from_type("Folder").collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("folders".to_string(), ReturnValue::from_traversal_value_array_with_mixin(folders.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getEntityByTypeInput {

pub file_id: ID,
pub entity_type: String
}
#[handler(with_read)]
pub fn getEntityByType (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let entity = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.file_id)

.out("File_to_Entity",&EdgeType::Node)

.filter_ref(|val, txn|{
                if let Ok(val) = val { 
                    Ok(G::new_from(Arc::clone(&db), &txn, val.clone())

.check_property("entity_type")

.map_value_or(false, |v| *v == data.entity_type.clone())?)
                } else {
                    Ok(false)
                }
            }).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("entity".to_string(), ReturnValue::from_traversal_value_array_with_mixin(entity.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct deleteFileInput {

pub file_id: ID
}
#[handler(with_write)]
pub fn deleteFile (input: &HandlerInput) -> Result<Response, GraphError> {
{
    Drop::<Vec<_>>::drop_traversal(
                G::new(Arc::clone(&db), &txn)
.n_from_id(&data.file_id)

.in_e("Folder_to_File").collect_to::<Vec<_>>(),
                Arc::clone(&db),
                &mut txn,
            )?;;
    Drop::<Vec<_>>::drop_traversal(
                G::new(Arc::clone(&db), &txn)
.n_from_id(&data.file_id)

.in_e("Root_to_File").collect_to::<Vec<_>>(),
                Arc::clone(&db),
                &mut txn,
            )?;;
    Drop::<Vec<_>>::drop_traversal(
                G::new(Arc::clone(&db), &txn)
.n_from_id(&data.file_id).collect_to_obj(),
                Arc::clone(&db),
                &mut txn,
            )?;;
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("success".to_string(), ReturnValue::from(Value::from("success")));

}
}

#[derive(Serialize, Deserialize)]
pub struct deleteSubEntityInput {

pub entity_id: ID
}
#[handler(with_write)]
pub fn deleteSubEntity (input: &HandlerInput) -> Result<Response, GraphError> {
{
    Drop::<Vec<_>>::drop_traversal(
                G::new(Arc::clone(&db), &txn)
.n_from_id(&data.entity_id)

.in_e("Entity_to_Entity").collect_to::<Vec<_>>(),
                Arc::clone(&db),
                &mut txn,
            )?;;
    Drop::<Vec<_>>::drop_traversal(
                G::new(Arc::clone(&db), &txn)
.n_from_id(&data.entity_id).collect_to_obj(),
                Arc::clone(&db),
                &mut txn,
            )?;;
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("success".to_string(), ReturnValue::from(Value::from("success")));

}
}

#[derive(Serialize, Deserialize)]
pub struct getFolderInput {

pub folder_id: ID
}
#[handler(with_read)]
pub fn getFolder (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let folder = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.folder_id).collect_to_obj();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("folder".to_string(), ReturnValue::from_traversal_value_with_mixin(folder.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getRootFoldersInput {

pub root_id: ID
}
#[handler(with_read)]
pub fn getRootFolders (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let folders = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.root_id)

.out("Root_to_Folder",&EdgeType::Node).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("folders".to_string(), ReturnValue::from_traversal_value_array_with_mixin(folders.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct updateFileInput {

pub file_id: ID,
pub text: String,
pub extracted_at: DateTime<Utc>
}
#[handler(with_write)]
pub fn updateFile (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let file = {let update_tr = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.file_id)
    .collect_to::<Vec<_>>();G::new_mut_from(Arc::clone(&db), &mut txn, update_tr)
    .update(Some(props! { "text" => &data.text, "extracted_at" => &data.extracted_at }))
    .collect_to_obj()};
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("file".to_string(), ReturnValue::from_traversal_value_with_mixin(file.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getFileFolderInput {

pub file_id: ID
}
#[handler(with_read)]
pub fn getFileFolder (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let folder = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.file_id)

.in_("Folder_to_File",&EdgeType::Node).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("folder".to_string(), ReturnValue::from_traversal_value_array_with_mixin(folder.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct deleteSuperEntityInput {

pub entity_id: ID
}
#[handler(with_write)]
pub fn deleteSuperEntity (input: &HandlerInput) -> Result<Response, GraphError> {
{
    Drop::<Vec<_>>::drop_traversal(
                G::new(Arc::clone(&db), &txn)
.n_from_id(&data.entity_id)

.in_e("File_to_Entity").collect_to::<Vec<_>>(),
                Arc::clone(&db),
                &mut txn,
            )?;;
    Drop::<Vec<_>>::drop_traversal(
                G::new(Arc::clone(&db), &txn)
.n_from_id(&data.entity_id)

.out("Entity_to_EmbededCode",&EdgeType::Vec).collect_to::<Vec<_>>(),
                Arc::clone(&db),
                &mut txn,
            )?;;
    Drop::<Vec<_>>::drop_traversal(
                G::new(Arc::clone(&db), &txn)
.n_from_id(&data.entity_id).collect_to_obj(),
                Arc::clone(&db),
                &mut txn,
            )?;;
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("success".to_string(), ReturnValue::from(Value::from("success")));

}
}

#[derive(Serialize, Deserialize)]
pub struct getFileInput {

pub file_id: ID
}
#[handler(with_read)]
pub fn getFile (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let file = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.file_id).collect_to_obj();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("file".to_string(), ReturnValue::from_traversal_value_array_with_mixin(G::new_from(Arc::clone(&db), &txn, file.clone())

.map_traversal(|item, txn| { exclude_field!(remapping_vals, item.clone(), "text")?;
 Ok(item) }).collect_to::<Vec<_>>().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getRootFilesInput {

pub root_id: ID
}
#[handler(with_read)]
pub fn getRootFiles (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let files = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.root_id)

.out("Root_to_File",&EdgeType::Node).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("files".to_string(), ReturnValue::from_traversal_value_array_with_mixin(G::new_from(Arc::clone(&db), &txn, files.clone())

.map_traversal(|item, txn| { exclude_field!(remapping_vals, item.clone(), "text")?;
 Ok(item) }).collect_to::<Vec<_>>().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct getFileByExtensionInput {

pub extension: String
}
#[handler(with_read)]
pub fn getFileByExtension (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let files = G::new(Arc::clone(&db), &txn)
.n_from_type("File")

.filter_ref(|val, txn|{
                if let Ok(val) = val { 
                    Ok(G::new_from(Arc::clone(&db), &txn, val.clone())

.check_property("extension")

.map_value_or(false, |v| *v == data.extension.clone())?)
                } else {
                    Ok(false)
                }
            }).collect_to::<Vec<_>>();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("files".to_string(), ReturnValue::from_traversal_value_array_with_mixin(G::new_from(Arc::clone(&db), &txn, files.clone())

.map_traversal(|item, txn| { exclude_field!(remapping_vals, item.clone(), "text")?;
 Ok(item) }).collect_to::<Vec<_>>().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct createRootInput {

pub name: String
}
#[handler(with_write)]
pub fn createRoot (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let root = G::new_mut(Arc::clone(&db), &mut txn)
.add_n("Root", Some(props! { "name" => &data.name, "extracted_at" => chrono::Utc::now().to_rfc3339() }), None).collect_to_obj();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("root".to_string(), ReturnValue::from_traversal_value_with_mixin(root.clone().clone(), remapping_vals.borrow_mut()));

}
}

#[derive(Serialize, Deserialize)]
pub struct createSubFolderInput {

pub folder_id: ID,
pub name: String
}
#[handler(with_write)]
pub fn createSubFolder (input: &HandlerInput) -> Result<Response, GraphError> {
{
    let folder = G::new(Arc::clone(&db), &txn)
.n_from_id(&data.folder_id).collect_to_obj();
    let subfolder = G::new_mut(Arc::clone(&db), &mut txn)
.add_n("Folder", Some(props! { "name" => &data.name, "extracted_at" => chrono::Utc::now().to_rfc3339() }), None).collect_to_obj();
    G::new_mut(Arc::clone(&db), &mut txn)
.add_e("Folder_to_Folder", None, folder.id(), subfolder.id(), true, EdgeType::Node).collect_to_obj();
let mut return_vals: HashMap<String, ReturnValue> = HashMap::new();
        return_vals.insert("subfolder".to_string(), ReturnValue::from_traversal_value_with_mixin(subfolder.clone().clone(), remapping_vals.borrow_mut()));

}
}
