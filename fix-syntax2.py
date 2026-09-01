with open("apps/web/components/canvas/experiment-modal.tsx", "r", encoding="utf-8") as f:
    text = f.read()

bad_str = """                                    ))}

                                    

                                    

    );

                                </div>
});"""

good_str = """                                    ))}

                                </div>
    );

});"""

text = text.replace(bad_str, good_str)
with open("apps/web/components/canvas/experiment-modal.tsx", "w", encoding="utf-8") as f:
    f.write(text)
