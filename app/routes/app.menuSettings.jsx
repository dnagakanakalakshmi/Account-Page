import React, { useState, useEffect } from "react";
import {AppProvider,Page,Layout,Card,Text,Select,FormLayout,Button,Banner,TextField,Checkbox,Toast,Frame,Form,Icon,Tabs,} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { DeleteIcon, DragHandleIcon } from "@shopify/polaris-icons";
import { useLoaderData } from "@remix-run/react";
import shopify from "../shopify.server";
import { json } from "@remix-run/node";

const DEFAULT_TABS = ['accountDetails', 'addresses', 'orders'];

export const loader = async ({ request }) => {
  const { session } = await shopify.authenticate.admin(request);
  const { shop } = session;
  return json({ shop: shop });
};

export default function CombinedSettings() {
  const [menuTabs, setMenuTabs] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [scriptInput, setScriptInput] = useState("");
  const [colorPrimary, setColorPrimary] = useState("#000000");
  const [colorSecondary, setColorSecondary] = useState("#ffffff");
  const [colorTertiary, setColorTertiary] = useState("#f4f6f8");
  const [colorQuaternary, setColorQuaternary] = useState("#7983e61a");
  const [fontPrimary, setFontPrimary] = useState("");
  const [fontSecondary, setFontSecondary] = useState("");
  const [fontTertiary, setFontTertiary] = useState("");
  const [logoutSvg, setLogoutSvg] = useState("");
  const [deleteSvg, setDeleteSvg] = useState("");
  const [logoutMode, setLogoutMode] = useState("svg");
  const [deleteMode, setDeleteMode] = useState("svg");
  const [logoutImageFile, setLogoutImageFile] = useState(null);
  const [deleteImageFile, setDeleteImageFile] = useState(null);
  const [logoutImagePreview, setLogoutImagePreview] = useState("");
  const [deleteImagePreview, setDeleteImagePreview] = useState("");
  const [logoutRemoved, setLogoutRemoved] = useState(false);
  const [deleteRemoved, setDeleteRemoved] = useState(false);
  const [noOrdersSvg, setNoOrdersSvg] = useState("");
  const [noOrdersMode, setNoOrdersMode] = useState("svg");
  const [noOrdersImageFile, setNoOrdersImageFile] = useState(null);
  const [noOrdersImagePreview, setNoOrdersImagePreview] = useState("");
  const [noOrdersRemoved, setNoOrdersRemoved] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [dragStartIndex, setDragStartIndex] = useState(null);
  const { shop } = useLoaderData();
 
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`/app/apimenu?storeUrl=${shop}`);
        const data = await response.json();
        if (data.reply && Array.isArray(data.reply.menuTabs)) {
          const transformedTabs = data.reply.menuTabs.map((tab) => ({
            key: tab.key || `generated-${Math.random().toString(36).substr(2, 9)}`,
            label: tab.label || "Unnamed Tab",
            enabled: tab.enabled !== false,
            link: tab.link || "",
            cancelOrderBehavior: tab.cancelOrderBehavior || "direct",
            isDefault: DEFAULT_TABS.includes(tab.key),
          }));
          setMenuTabs(transformedTabs);

          setColorPrimary(data.reply.colorPrimary || "#000000");
          setColorSecondary(data.reply.colorSecondary || "#ffffff");
          setColorTertiary(data.reply.colorTertiary || "#f4f6f8");
          setColorQuaternary(data.reply.colorQuaternary || "#7983e61a");
          setFontPrimary(data.reply.fontPrimary || "");
          setFontSecondary(data.reply.fontSecondary || "");
          setFontTertiary(data.reply.fontTertiary || "");
          setLogoutSvg(data.reply.logoutSvg || "");
          setDeleteSvg(data.reply.deleteSvg || "");

          // Determine whether stored logout/delete values are SVG markup or image URLs
          if (data.reply.logoutSvg) {
            const v = data.reply.logoutSvg;
            if (typeof v === 'string' && v.trim().startsWith('<')) {
              setLogoutMode('svg');
              setLogoutSvg(v);
            } else {
              setLogoutMode('image');
              setLogoutImagePreview(v);
              setLogoutRemoved(false);
            }
          }
          if (data.reply.deleteSvg) {
            const v2 = data.reply.deleteSvg;
            if (typeof v2 === 'string' && v2.trim().startsWith('<')) {
              setDeleteMode('svg');
              setDeleteSvg(v2);
            } else {
              setDeleteMode('image');
              setDeleteImagePreview(v2);
              setDeleteRemoved(false);
            }
          }

          if (data.reply.noOrdersImage) {
            const v3 = data.reply.noOrdersImage;
            if (typeof v3 === 'string' && v3.trim().startsWith('<')) {
              setNoOrdersMode('svg');
              setNoOrdersSvg(v3);
            } else {
              setNoOrdersMode('image');
              setNoOrdersImagePreview(v3);
              setNoOrdersRemoved(false);
            }
          }

          if (data.reply.script && data.reply.cancelOrderBehavior === "script") {
            // Extract the original script from the wrapped function
            // The stored format is: (function customOrderCancelScript(){try{(0,eval)(JSON.stringify(originalCode))}catch(e){...}})();
            // We need to extract the string inside JSON.stringify() and parse it
            const match = data.reply.script.match(/\(0,eval\)\(({[^}]*}|"[^"]*")\)/);
            let cleaned = "";
            if (match && match[1]) {
              try {
                // The match contains a JSON-stringified string, so we parse it to get the original
                cleaned = JSON.parse(match[1]);
              } catch (e) {
                console.warn("Failed to parse script, using raw script", e);
                cleaned = data.reply.script;
              }
            }
            setScriptInput(cleaned);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    const formData = new FormData();
    formData.append("menuTabs", JSON.stringify(menuTabs));
    formData.append("scriptInput", scriptInput);
    const cancelOrderBehavior =
    menuTabs.find((tab) => tab.key === "orders")?.cancelOrderBehavior || "direct";
    formData.append("cancelOrderBehavior", cancelOrderBehavior);
    formData.append("colorPrimary", colorPrimary);
    formData.append("colorSecondary", colorSecondary);
    formData.append("colorTertiary", colorTertiary);
    formData.append("colorQuaternary", colorQuaternary);
    formData.append("fontPrimary", fontPrimary);
    formData.append("fontSecondary", fontSecondary);
    formData.append("fontTertiary", fontTertiary);
    // Append SVG text when in svg mode; append files when in image mode.
    // Do NOT append empty placeholders unless the user explicitly removed an image.
    if (logoutMode === 'svg') {
      formData.append("logoutSvg", logoutSvg);
    } else if (logoutMode === 'image' && logoutImageFile) {
      formData.append("logoutImage", logoutImageFile);
    } else if (logoutRemoved) {
      // explicit remove request -> send empty value so backend clears the field
      formData.append("logoutSvg", "");
    }

    if (deleteMode === 'svg') {
      formData.append("deleteSvg", deleteSvg);
    } else if (deleteMode === 'image' && deleteImageFile) {
      formData.append("deleteImage", deleteImageFile);
    } else if (deleteRemoved) {
      formData.append("deleteSvg", "");
    }

    // No-orders image
    if (noOrdersMode === 'svg') {
      formData.append("noOrdersSvg", noOrdersSvg);
    } else if (noOrdersMode === 'image' && noOrdersImageFile) {
      formData.append("noOrdersImage", noOrdersImageFile);
    } else if (noOrdersRemoved) {
      formData.append("noOrdersSvg", "");
    }
    try {
      const response = await fetch(`/app/apimenu?storeUrl=${shop}`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.reply) {
        setToastActive(true);
        setSaveStatus("success");
        setSaveMessage("Settings saved successfully!");
      } else {
        setSaveStatus("error");
        setSaveMessage(result.message || "Failed to save settings");
      }
    } catch (err) {
      setSaveStatus("error");
      setSaveMessage(err.message || "An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const addNewTab = () => {
    const newTab = {
      key: `custom-${crypto.randomUUID()}`,
      label: "New Tab",
      enabled: true,
      link: "",
      isDefault: false
    };
    setMenuTabs((prev) => [...prev, newTab]);
  };

  const updateTab = (index, changes) => {
    setMenuTabs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], ...changes };
      return updated;
    });
  };

  const removeTab = (index) => {
    if (menuTabs[index].isDefault) return;
    setMenuTabs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index) => {
    setDragStartIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (index) => {
    if (dragStartIndex === null || dragStartIndex === index) return;
    const updated = [...menuTabs];
    const [movedTab] = updated.splice(dragStartIndex, 1);
    updated.splice(index, 0, movedTab);
    setMenuTabs(updated);
    setDragStartIndex(null);
  };

  if (loading || error) {
    return (
      <AppProvider i18n={{}}>
        <Frame>
          <Page title={loading ? "Loading..." : "Error"}>
            <Layout>
              <Layout.Section>
                {loading && (
                  <Card sectioned>
                    <Text alignment="center">Loading settings...</Text>
                  </Card>
                )}
                {error && (
                  <Banner status="critical" title="Error loading settings">
                    <p>{error}</p>
                  </Banner>
                )}
              </Layout.Section>
            </Layout>
          </Page>
        </Frame>
      </AppProvider>
    );
  }

  return (
    <AppProvider i18n={{}}>
      <Frame>
        <style>{`.fixed-svg-textarea textarea { height:150px !important; max-height:150px !important; overflow:auto !important; resize:none !important; font-family: monospace !important; }`}</style>
        <Page title="Dista App - Menu Settings">
          <TitleBar title="Dista App - Settings" />
          <Form onSubmit={handleSubmit}>
            <Layout>
              <Layout.Section>
                {toastActive && (
                  <Toast
                    content={saveMessage}
                    onDismiss={() => setToastActive(false)}
                    duration={3000}
                  />
                )}
                {saveStatus === "error" && (
                  <Banner status="critical" onDismiss={() => setSaveStatus(null)}>
                    <p>{saveMessage}</p>
                  </Banner>
                )}

                <div style={{ marginBottom: 16 }}>
                  <Tabs
                    tabs={[
                      { id: "tab-menu", content: "Menu Tabs Settings" },
                      { id: "tab-ui", content: "UI Customization Settings" },
                      { id: "tab-cancel", content: "Order Cancel Behavior" },
                    ]}
                    selected={selectedTab}
                    onSelect={setSelectedTab}
                  />
                </div>

                {selectedTab === 0 && (
                  <Card title="Tab Settings" sectioned>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Tab Settings</div>
                    {/* <div style={{marginBottom:'10px', display: "flex", justifyContent: "flex-end" }}>
                        <button
                          className="custom-button"
                          type="submit"
                          disabled={isSaving}
                          style={{
                            backgroundColor: "#000",
                            color: "#fff",
                            padding: "8px 12px",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: 600,
                            cursor: isSaving ? "not-allowed" : "pointer",
                            opacity: isSaving ? 0.7 : 1,
                          }}
                        >
                          {isSaving ? "Saving..." : "Save Settings"}
                        </button>
                      </div> */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {menuTabs.map((tab, index) => (
                        <div
                          key={tab.key}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(index)}
                          style={{
                            borderRadius: "6px",
                            background: "#fff",
                            cursor: "grab",
                          }}
                        >
                          <Card sectioned>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                              <div style={{ padding: "8px" }}>
                                <Icon source={DragHandleIcon} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <FormLayout>
                                  <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                    <div style={{ flex: 1 }}>
                                      <TextField
                                        label="Tab Name"
                                        value={tab.label}
                                        onChange={(value) => updateTab(index, { label: value })}
                                      />
                                    </div>
                                    <div>
                                      <Checkbox
                                        label="Enable"
                                        checked={tab.enabled}
                                        onChange={(value) => updateTab(index, { enabled: value })}
                                      />
                                    </div>
                                      {!tab.isDefault && (
                                      <Button
                                        icon={DeleteIcon}
                                        onClick={() => removeTab(index)}
                                        destructive
                                      />
                                    )}
                                  </div>
                                  {!tab.isDefault && tab.enabled && (
                                    <TextField
                                      label="Page Link"
                                      value={tab.link}
                                      onChange={(value) => updateTab(index, { link: value })}
                                      placeholder="/pages/custom-tab"
                                    />
                                  )}
                                </FormLayout>
                              </div>
                            </div>
                          </Card>
                        </div>
                      ))}
                      <div style={{display:'flex',justifyContent:'center',alignItems:'center'}}>
                      <button
                        className="custom-button"
                        onClick={addNewTab}
                        type="button"
                        style={{
                          padding: "8px 12px",
                          fontSize: "14px",
                          backgroundColor: "#000",
                          fontWeight:600,
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                        }}
                      >
                        Add New Tab
                      </button>
                      </div>
                    </div>
                  </Card>
                )}

                {selectedTab === 1 && (
                  <Card title="UI Customization Settings" sectioned>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>UI Customization Settings</div>
                    <FormLayout>
                      <FormLayout.Group>
                        <TextField
                          label="Color 1"
                          value={colorPrimary}
                          onChange={setColorPrimary}
                          type="color"
                        />
                        <TextField
                          label="Color 2"
                          value={colorSecondary}
                          onChange={setColorSecondary}
                          type="color"
                        />
                        <TextField
                          label="Color 3"
                          value={colorTertiary}
                          onChange={setColorTertiary}
                          type="color"
                        />
                        <TextField
                          label="Color 4 (Active Menu)"
                          value={colorQuaternary}
                          onChange={setColorQuaternary}
                          type="color"
                        />
                      </FormLayout.Group>
                      <FormLayout.Group>
                        <TextField
                          label="Font Size 1"
                          value={fontPrimary}
                          onChange={setFontPrimary}
                          placeholder="16px"
                        />
                        <TextField
                          label="Font Size 2"
                          value={fontSecondary}
                          onChange={setFontSecondary}
                          placeholder="14px"
                        />
                        <TextField
                          label="Font Size 3"
                          value={fontTertiary}
                          onChange={setFontTertiary}
                          placeholder="12px"
                        />
                      </FormLayout.Group>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <div style={{ marginBottom: 6, fontWeight: 600 }}>Logout Icon</div>
                          <div style={{ display: 'inline-flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #e6e6e6' }}>
                            <button
                              type="button"
                              onClick={() => setLogoutMode('svg')}
                              style={{
                                padding: '6px 12px',
                                background: logoutMode === 'svg' ? '#fff' : 'transparent',
                                border: 'none',
                                borderBottom: logoutMode === 'svg' ? '3px solid #000000' : '3px solid transparent',
                                fontWeight: logoutMode === 'svg' ? 600 : 400,
                                cursor: 'pointer'
                              }}
                            >
                              SVG
                            </button>
                            <button
                              type="button"
                              onClick={() => setLogoutMode('image')}
                              style={{
                                padding: '6px 12px',
                                background: logoutMode === 'image' ? '#fff' : 'transparent',
                                border: 'none',
                                borderBottom: logoutMode === 'image' ? '3px solid #000000' : '3px solid transparent',
                                fontWeight: logoutMode === 'image' ? 600 : 400,
                                cursor: 'pointer'
                              }}
                            >
                              Image
                            </button>
                          </div>
                          {logoutMode === 'svg' ? (
                            <div className="fixed-svg-textarea">
                              <TextField
                                label="SVG (Logout)"
                                value={logoutSvg}
                                onChange={setLogoutSvg}
                                multiline={8}
                                placeholder='<svg viewBox="0 0 24 24">...</svg>'
                              />
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const f = e.target.files && e.target.files[0];
                                    setLogoutImageFile(f || null);
                                    setLogoutImagePreview(f ? URL.createObjectURL(f) : '');
                                    setLogoutRemoved(false);
                                  }}
                              />
                                  {logoutImagePreview && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <img src={logoutImagePreview} alt="logout preview" style={{ height: 48 }} />
                                      <button type="button" onClick={() => { setLogoutImageFile(null); setLogoutImagePreview(''); setLogoutRemoved(true); }} className="custom-button">Remove</button>
                                    </div>
                                  )}
                            </div>
                          )}
                        </div>

                        <div>
                          <div style={{ marginBottom: 6, fontWeight: 600 }}>Delete Icon</div>
                          <div style={{ display: 'inline-flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #e6e6e6' }}>
                            <button
                              type="button"
                              onClick={() => setDeleteMode('svg')}
                              style={{
                                padding: '6px 12px',
                                background: deleteMode === 'svg' ? '#fff' : 'transparent',
                                border: 'none',
                                borderBottom: deleteMode === 'svg' ? '3px solid #000000' : '3px solid transparent',
                                fontWeight: deleteMode === 'svg' ? 600 : 400,
                                cursor: 'pointer'
                              }}
                            >
                              SVG
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteMode('image')}
                              style={{
                                padding: '6px 12px',
                                background: deleteMode === 'image' ? '#fff' : 'transparent',
                                border: 'none',
                                borderBottom: deleteMode === 'image' ? '3px solid #000000' : '3px solid transparent',
                                fontWeight: deleteMode === 'image' ? 600 : 400,
                                cursor: 'pointer'
                              }}
                            >
                              Image
                            </button>
                          </div>
                          {deleteMode === 'svg' ? (
                            <div className="fixed-svg-textarea">
                              <TextField
                                label="SVG (Delete)"
                                value={deleteSvg}
                                onChange={setDeleteSvg}
                                multiline={8}
                                placeholder='<svg viewBox="0 0 24 24">...</svg>'
                              />
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const f = e.target.files && e.target.files[0];
                                  setDeleteImageFile(f || null);
                                  setDeleteImagePreview(f ? URL.createObjectURL(f) : '');
                                  setDeleteRemoved(false);
                                }}
                              />
                              {deleteImagePreview && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <img src={deleteImagePreview} alt="delete preview" style={{ height: 48 }} />
                                  <button type="button" onClick={() => { setDeleteImageFile(null); setDeleteImagePreview(''); setDeleteRemoved(true); }} className="custom-button">Remove</button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* No Orders Image: placed inline below Logout/Delete */}
                      <div style={{ marginTop: 8 }}>
                        <div style={{ marginBottom: 6, fontWeight: 600 }}>No Orders Image</div>
                        <div style={{ display: 'inline-flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #e6e6e6', marginBottom: 8 }}>
                          <button
                            type="button"
                            onClick={() => setNoOrdersMode('svg')}
                            style={{
                              padding: '6px 12px',
                              background: noOrdersMode === 'svg' ? '#fff' : 'transparent',
                              border: 'none',
                              borderBottom: noOrdersMode === 'svg' ? '3px solid #000000' : '3px solid transparent',
                              fontWeight: noOrdersMode === 'svg' ? 600 : 400,
                              cursor: 'pointer'
                            }}
                          >
                            SVG
                          </button>
                          <button
                            type="button"
                            onClick={() => setNoOrdersMode('image')}
                            style={{
                              padding: '6px 12px',
                              background: noOrdersMode === 'image' ? '#fff' : 'transparent',
                              border: 'none',
                              borderBottom: noOrdersMode === 'image' ? '3px solid #000000' : '3px solid transparent',
                              fontWeight: noOrdersMode === 'image' ? 600 : 400,
                              cursor: 'pointer'
                            }}
                          >
                            Image
                          </button>
                        </div>
                        {noOrdersMode === 'svg' ? (
                          <div className="fixed-svg-textarea">
                            <TextField
                              label="SVG (No Orders)"
                              value={noOrdersSvg}
                              onChange={setNoOrdersSvg}
                              multiline={8}
                              placeholder='<svg viewBox="0 0 24 24">...</svg>'
                            />
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const f = e.target.files && e.target.files[0];
                                setNoOrdersImageFile(f || null);
                                setNoOrdersImagePreview(f ? URL.createObjectURL(f) : '');
                                setNoOrdersRemoved(false);
                              }}
                            />
                            {noOrdersImagePreview && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <img src={noOrdersImagePreview} alt="no orders preview" style={{ height: 48 }} />
                                <button type="button" onClick={() => { setNoOrdersImageFile(null); setNoOrdersImagePreview(''); setNoOrdersRemoved(true); }} className="custom-button">Remove</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </FormLayout>
                  </Card>
                )}

                {selectedTab === 2 && menuTabs.find((tab) => tab.key === "orders" && tab.enabled) && (
                  <Card title="Cancel Order Button Behavior" sectioned>
                    <Select
                      label="Select behavior"
                      options={[
                        { label: "Cancel Directly", value: "direct" },
                        { label: "Redirect to Script", value: "script" },
                      ]}
                      value={
                        menuTabs.find((t) => t.key === "orders")?.cancelOrderBehavior || "direct"
                      }
                      onChange={(value) =>
                        setMenuTabs((prev) =>
                          prev.map((tab) =>
                            tab.key === "orders"
                              ? { ...tab, cancelOrderBehavior: value }
                              : tab
                          )
                        )
                      }
                    />

                    {menuTabs.find((tab) => tab.key === "orders")?.cancelOrderBehavior ===
                      "script" && (
                      <>
                        <Text
                          as="p"
                          variant="bodyMd"
                          color="subdued"
                          style={{ marginTop: "16px" }}
                        >
                          Your code will run when the Cancel Order button is clicked.
                        </Text>

                        <pre
                          style={{
                            background: "#f4f6f8",
                            padding: "12px",
                            borderRadius: "4px",
                            marginTop: "12px",
                          }}
                        >
                          {`(function customOrderCancelScript() {\n  try {\n    // Your code here\n  } catch (e) {\n    console.error("Admin script failed", e);\n  }\n})();`}
                        </pre>

                        <TextField
                          label="Custom Code"
                          value={scriptInput}
                          onChange={setScriptInput}
                          multiline={8}
                          placeholder="// e.g. window.tidioChatApi.open();"
                        />
                      </>
                    )}
                  </Card>
                )}
                <div style={{ margin: "16px", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="custom-button"
                    type="submit"
                    disabled={isSaving}
                    style={{
                      backgroundColor: "#000",
                      color: "#fff",
                      padding: "8px 12px",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 600,
                      cursor: isSaving ? "not-allowed" : "pointer",
                      opacity: isSaving ? 0.7 : 1,
                    }}
                  >
                    {isSaving ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </Layout.Section>
            </Layout>
          </Form>
        </Page>
      </Frame>
    </AppProvider>
  );
}
