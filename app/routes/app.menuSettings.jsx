import React, { useState, useEffect } from "react";
import {AppProvider,Page,Layout,Card,Text,Select,FormLayout,Button,Banner,TextField,Checkbox,Toast,Frame,Form,Icon,} from "@shopify/polaris";
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
  const [scriptInput, setScriptInput] = useState("");
  const [toastActive, setToastActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [saveMessage, setSaveMessage] = useState("");
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

          if (data.reply.script && data.reply.cancelOrderBehavior === "script") {
            const cleaned = data.reply.script
              .replace(/^\(function customOrderCancelScript\(\) \{\n  try \{\n/, "")
              .replace(/\n  \} catch \(e\) \{\n    console\.error\("Admin script failed", e\);\n  \}\n\}\)\(\);$/, "")
              .trim();
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
    const formData = new FormData();
    formData.append("menuTabs", JSON.stringify(menuTabs));
    formData.append("scriptInput", scriptInput);
    const cancelOrderBehavior =
    menuTabs.find((tab) => tab.key === "orders")?.cancelOrderBehavior || "direct";
    formData.append("cancelOrderBehavior", cancelOrderBehavior);
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

                <Card title="Menu Tabs Settings" sectioned>
                  <div style={{marginBottom:'10px', display: "flex", justifyContent: "flex-end" }}>
                      <button
                        className="custom-button"
                        type="submit"
                        style={{
                          backgroundColor: "#000",
                          color: "#fff",
                          padding: "8px 12px",
                          border: "none",
                          borderRadius: "6px",
                          fontSize:'14px',
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Save Settings
                      </button>
                    </div>
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

                {menuTabs.find((tab) => tab.key === "orders" && tab.enabled) && (
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
              </Layout.Section>
            </Layout>
          </Form>
        </Page>
      </Frame>
    </AppProvider>
  );
}
