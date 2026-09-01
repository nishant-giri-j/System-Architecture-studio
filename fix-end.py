with open('apps/web/components/canvas/experiment-modal.tsx', 'r', encoding='utf-8') as f:
    code = f.read()

bad = """                                            </Markdown>\n\n                                        </div>\n\n                                    </div>\n\n\n\n\n                    </div>\n\n                </div>\n\n\n            </div>\n\n        </div>\n\n    );\n\n}"""
good = """                                            </Markdown>
                                        </div>
                                    </div>
                                )}
                    </div>
                </div>
                )}
            </div>
        </div>
    );
}"""

# Actually, replacing exactly might fail due to spaces. I'll use regex.
import re
pattern = re.compile(r"</Markdown>\s*</div>\s*</div>\s*</div>\s*</div>\s*</div>\s*</div>\s*\);\s*}", re.DOTALL)
good_end = """                                            </Markdown>
                                        </div>
                                    </div>
                                )}
                    </div>
                </div>
                )}
            </div>
        </div>
    );
}"""
new_code = pattern.sub(good_end, code)

with open('apps/web/components/canvas/experiment-modal.tsx', 'w', encoding='utf-8') as f:
    f.write(new_code)
