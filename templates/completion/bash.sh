__proj_cmdlist() {
  proj __complete commands 2>/dev/null | tr '\n' ' '
}
__proj_projects() {
  proj __complete projects 2>/dev/null | tr '\n' ' '
}
__proj_favs() {
  proj __complete fav-names 2>/dev/null | tr '\n' ' '
}
__proj_editors() {
  proj __complete editors 2>/dev/null | tr '\n' ' '
}
__proj_workspaces() {
  proj __complete workspaces 2>/dev/null | tr '\n' ' '
}
__proj_tag_ids() {
  proj __complete tag-ids 2>/dev/null | tr '\n' ' '
}
__proj_projrc_keys() {
  proj __complete projrc-keys 2>/dev/null | tr '\n' ' '
}
_proj() {
  local cur
  COMPREPLY=()
  cur="${COMP_WORDS[COMP_CWORD]}"
  if [ "${#COMP_WORDS[@]}" -eq 2 ]; then
    COMPREPLY=( $(compgen -W "$(__proj_cmdlist)" -- "$cur") )
    return
  fi
  case "${COMP_WORDS[1]}" in
    ls)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "--json -f -o -t --grep -h --help $(__proj_tag_ids)" -- "$cur") )
      elif [ "$COMP_CWORD" -ge 3 ]; then
        COMPREPLY=( $(compgen -W "--json -f -o -t --grep $(__proj_tag_ids)" -- "$cur") )
      fi
      ;;
    dir)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "-w -h --help $(__proj_workspaces)" -- "$cur") $(compgen -o dirnames -- "$cur") )
      elif [ "$COMP_CWORD" -eq 3 ]; then
        if [ "${COMP_WORDS[2]}" = "-w" ]; then
          COMPREPLY=( $(compgen -W "$(__proj_workspaces)" -- "$cur") )
        else
          COMPREPLY=( $(compgen -W "-w" -- "$cur") )
        fi
      elif [ "$COMP_CWORD" -eq 4 ] && [ "${COMP_WORDS[3]}" = "-w" ]; then
        COMPREPLY=( $(compgen -W "$(__proj_workspaces)" -- "$cur") )
      fi
      ;;
    use)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "-h --help $(__proj_workspaces)" -- "$cur") )
      fi
      ;;
    completion)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "bash zsh fish -h --help" -- "$cur") )
      fi
      ;;
    editor)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "-h --help $(__proj_editors)" -- "$cur") )
      fi
      ;;
    new)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "--dry-run --force -h --help" -- "$cur") $(compgen -o dirnames -- "$cur") )
      elif [ "$COMP_CWORD" -ge 3 ]; then
        COMPREPLY=( $(compgen -W "--dry-run --force" -- "$cur") $(compgen -o dirnames -- "$cur") )
      fi
      ;;
    clone)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "-h --help" -- "$cur") )
      fi
      ;;
    verify|tags)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "-h --help" -- "$cur") )
      fi
      ;;
    open)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "-h --help $(__proj_projects)" -- "$cur") )
      elif [ "$COMP_CWORD" -eq 3 ]; then
        COMPREPLY=( $(compgen -W "-r --root --wt -h --help $(__proj_editors)" -- "$cur") )
      fi
      ;;
    pwd)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "-h --help $(__proj_projects)" -- "$cur") )
      elif [ "$COMP_CWORD" -eq 3 ]; then
        COMPREPLY=( $(compgen -W "--wt -h --help" -- "$cur") )
      elif [ "$COMP_CWORD" -ge 4 ] && [ "${COMP_WORDS[3]}" = "--wt" ]; then
        COMPREPLY=( $(compgen -W "main" -- "$cur") )
      fi
      ;;
    wt)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "-h --help $(__proj_projects)" -- "$cur") )
      elif [ "$COMP_CWORD" -eq 4 ]; then
        COMPREPLY=( $(compgen -W "-b -h --help" -- "$cur") )
      fi
      ;;
    tag)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "-d -p -h --help" -- "$cur") )
      elif [ "$COMP_CWORD" -eq 3 ]; then
        if [ "${COMP_WORDS[2]}" = "-p" ]; then
          COMPREPLY=( $(compgen -W "$(__proj_projects)" -- "$cur") )
        elif [ "${COMP_WORDS[2]}" = "-d" ]; then
          if [[ "$cur" == -* ]]; then
            COMPREPLY=( $(compgen -W "-p -h --help" -- "$cur") )
          else
            COMPREPLY=( $(compgen -W "$(__proj_tag_ids)" -- "$cur") )
          fi
        else
          COMPREPLY=( $(compgen -W "-d -p -h --help $(__proj_tag_ids)" -- "$cur") )
        fi
      elif [ "$COMP_CWORD" -eq 4 ] && [ "${COMP_WORDS[3]}" = "-p" ]; then
        COMPREPLY=( $(compgen -W "$(__proj_projects)" -- "$cur") )
      elif [ "$COMP_CWORD" -eq 5 ] && [ "${COMP_WORDS[4]}" = "-p" ]; then
        COMPREPLY=( $(compgen -W "$(__proj_projects)" -- "$cur") )
      fi
      ;;
    status)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "--json -h --help $(__proj_projects)" -- "$cur") )
      fi
      ;;
    rm)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "-f --force -h --help $(__proj_projects)" -- "$cur") )
      fi
      ;;
    set)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "-d -h --help $(__proj_projects)" -- "$cur") )
      elif [ "$COMP_CWORD" -eq 3 ]; then
        if [ "${COMP_WORDS[2]}" = "-d" ]; then
          COMPREPLY=( $(compgen -W "$(__proj_projects)" -- "$cur") )
        else
          COMPREPLY=( $(compgen -W "$(__proj_projrc_keys)" -- "$cur") )
        fi
      elif [ "$COMP_CWORD" -eq 4 ]; then
        if [ "${COMP_WORDS[2]}" = "-d" ]; then
          COMPREPLY=( $(compgen -W "$(__proj_projrc_keys)" -- "$cur") )
        elif [ "${COMP_WORDS[3]}" = "-d" ]; then
          COMPREPLY=( $(compgen -W "$(__proj_projrc_keys)" -- "$cur") )
        else
          COMPREPLY=( $(compgen -W "-d" -- "$cur") )
        fi
      fi
      ;;
    get)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "-h --help $(__proj_projects)" -- "$cur") )
      elif [ "$COMP_CWORD" -eq 3 ]; then
        COMPREPLY=( $(compgen -W "$(__proj_projrc_keys)" -- "$cur") )
      fi
      ;;
    fav)
      if [ "$COMP_CWORD" -eq 2 ]; then
        COMPREPLY=( $(compgen -W "-d -h --help $(__proj_projects)" -- "$cur") )
      elif [ "$COMP_CWORD" -eq 3 ] && [ "${COMP_WORDS[2]}" = "-d" ]; then
        COMPREPLY=( $(compgen -W "$(__proj_favs)" -- "$cur") )
      fi
      ;;
    mv)
      if [ "$COMP_CWORD" -eq 2 ] || [ "$COMP_CWORD" -eq 3 ]; then
        COMPREPLY=( $(compgen -W "-h --help $(__proj_projects)" -- "$cur") )
      fi
      ;;
  esac
}
complete -F _proj proj
